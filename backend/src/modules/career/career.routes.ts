import { Router, Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { prisma } from "../../config/database";
import { config } from "../../config/env";
import {
  authenticate,
  requireRole,
  AuthRequest,
} from "../../middleware/auth.middleware";
import { AppError } from "../../middleware/error.middleware";
import {
  accountInput,
  choice,
  completion,
  digest,
  link,
  profileInput,
  text,
} from "./career.validation";
import {
  CareerRequest,
  optionalSession,
  requireCareer,
  approvedEmployer,
  originGuard,
  safeAccount,
  startSession,
  sessionToken,
  clearSession,
} from "./career.auth";

const router = Router();
const action =
  (fn: (req: CareerRequest, res: Response) => Promise<void>) =>
  (req: CareerRequest, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);
const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  message: {
    message: "Urinishlar ko‘paydi. 15 daqiqadan keyin qayta urinib ko‘ring.",
  },
});
const visible: Prisma.CareerProfileWhereInput = {
  published: true,
  contact_consent: true,
  certificate: { status: "active" },
  account: { status: "active" },
};
const publicSelect = {
  id: true,
  headline: true,
  bio: true,
  city: true,
  level: true,
  work_format: true,
  work_type: true,
  availability: true,
  technologies: true,
  skills: true,
  languages: true,
  experience: true,
  projects: true,
  github: true,
  portfolio: true,
  avatar_url: true,
  updated_at: true,
  certificate: {
    select: { full_name: true, course_name: true, course_end_date: true },
  },
} satisfies Prisma.CareerProfileSelect;

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.use(originGuard);

// Operator permissions stay in the existing Verify authentication namespace.
const admin = Router();
admin.use(authenticate, requireRole("super_admin"));
admin.get(
  "/accounts",
  action(async (_req, res) => {
    const data = await prisma.careerAccount.findMany({
      orderBy: { created_at: "desc" },
      take: 200,
      include: {
        profile: {
          select: {
            id: true,
            headline: true,
            published: true,
            certificate: { select: { serial_number: true } },
          },
        },
      },
    });
    res.json({ data: data.map(safeAccount) });
  }),
);
admin.get(
  "/summary",
  action(async (_req, res) => {
    const [graduates, employers, pending, blocked, published, events] =
      await prisma.$transaction([
        prisma.careerAccount.count({ where: { role: "graduate" } }),
        prisma.careerAccount.count({ where: { role: "employer" } }),
        prisma.careerAccount.count({ where: { status: "pending" } }),
        prisma.careerAccount.count({ where: { status: "blocked" } }),
        prisma.careerProfile.count({ where: { published: true } }),
        prisma.careerEvent.count(),
      ]);
    res.json({
      data: { graduates, employers, pending, blocked, published, events },
    });
  }),
);
admin.post(
  "/invites",
  action(async (req, res) => {
    const serial = text(req.body.serial_number, "Sertifikat raqami", 3, 100);
    const cert = await prisma.certificate.findFirst({
      where: {
        serial_number: { equals: serial, mode: "insensitive" },
        status: "active",
      },
      include: { career_profile: true },
    });
    if (!cert || cert.career_profile)
      throw new AppError(
        "Sertifikat topilmadi yoki allaqachon bog‘langan.",
        400,
      );
    const code = randomBytes(18).toString("base64url");
    await prisma.$transaction(async (tx) => {
      await tx.careerInvite.updateMany({
        where: { certificate_id: cert.id, consumed_at: null },
        data: { expires_at: new Date() },
      });
      await tx.careerInvite.create({
        data: {
          certificate_id: cert.id,
          code_hash: digest(code),
          expires_at: new Date(Date.now() + 7 * 86400000),
        },
      });
      await tx.auditLog.create({
        data: {
          user_id: (req as AuthRequest).user!.id,
          action: "updated",
          certificate_id: cert.id,
          details: { career_action: "invite_issued" },
        },
      });
    });
    res.json({ data: { code, full_name: cert.full_name, expires_in_days: 7 } });
  }),
);
admin.patch(
  "/accounts/:id",
  action(async (req, res) => {
    const status = choice(req.body.status, "Holat", [
      "pending",
      "active",
      "blocked",
    ]) as "pending" | "active" | "blocked";
    await prisma.$transaction(async (tx) => {
      await tx.careerAccount.update({
        where: { id: String(req.params.id) },
        data: { status },
      });
      if (status === "blocked")
        await tx.careerSession.deleteMany({
          where: { account_id: String(req.params.id) },
        });
      await tx.careerEvent.create({
        data: {
          action: "account_moderated",
          target_id: String(req.params.id),
          details: { status, admin_id: (req as AuthRequest).user!.id },
        },
      });
    });
    res.json({ success: true });
  }),
);
admin.get(
  "/events",
  action(async (_req, res) => {
    res.json({
      data: await prisma.careerEvent.findMany({
        take: 100,
        orderBy: { created_at: "desc" },
        include: {
          account: {
            select: { full_name: true, email: true, role: true },
          },
        },
      }),
    });
  }),
);
router.use("/admin", admin);

router.post(
  "/eligibility",
  authLimit,
  action(async (req, res) => {
    const serial = text(req.body.serial_number, "Sertifikat raqami", 3, 100);
    const code = text(req.body.code, "Faollashtirish kodi", 10, 100);
    const invite = await prisma.careerInvite.findUnique({
      where: { code_hash: digest(code) },
      include: { certificate: { include: { career_profile: true } } },
    });
    if (
      !invite ||
      invite.consumed_at ||
      invite.expires_at < new Date() ||
      invite.certificate.status !== "active" ||
      invite.certificate.career_profile ||
      invite.certificate.serial_number.toLowerCase() !== serial.toLowerCase()
    )
      throw new AppError(
        "Sertifikat yoki faollashtirish kodi yaroqsiz. Akademiya administratoriga murojaat qiling.",
        400,
      );
    const grant = randomBytes(32).toString("base64url");
    await prisma.careerInvite.update({
      where: { id: invite.id },
      data: {
        grant_hash: digest(grant),
        grant_expires: new Date(Date.now() + 10 * 60000),
      },
    });
    res.json({
      data: {
        grant,
        full_name: invite.certificate.full_name,
        course_name: invite.certificate.course_name,
        serial_number: invite.certificate.serial_number,
      },
    });
  }),
);
router.post(
  "/register",
  authLimit,
  action(async (req, res) => {
    const input = accountInput(req.body);
    const role = choice(req.body.role, "Rol", ["graduate", "employer"]) as
      "graduate" | "employer";
    const password_hash = await bcrypt.hash(input.password, 12);
    const a = await prisma.$transaction(async (tx) => {
      let certificateId: string | undefined;
      let fullName: string;
      if (role === "graduate") {
        const grant = text(req.body.grant, "Tekshiruv tasdig‘i", 20, 100);
        const invite = await tx.careerInvite.findUnique({
          where: { grant_hash: digest(grant) },
        });
        if (
          !invite ||
          invite.consumed_at ||
          !invite.grant_expires ||
          invite.grant_expires < new Date() ||
          invite.expires_at < new Date()
        )
          throw new AppError("Sertifikatni qayta tekshiring.", 400);
        // Lock the canonical certificate while claiming; concurrent requests cannot claim it twice.
        await tx.$queryRaw`SELECT id FROM certificates WHERE id = ${invite.certificate_id} FOR UPDATE`;
        const cert = await tx.certificate.findUnique({
          where: { id: invite.certificate_id },
          include: { career_profile: true },
        });
        if (!cert || cert.status !== "active" || cert.career_profile)
          throw new AppError("Sertifikat yaroqsiz yoki band.", 409);
        const consumed = await tx.careerInvite.updateMany({
          where: {
            id: invite.id,
            consumed_at: null,
            grant_hash: digest(grant),
            grant_expires: { gt: new Date() },
            expires_at: { gt: new Date() },
          },
          data: { consumed_at: new Date() },
        });
        if (consumed.count !== 1)
          throw new AppError("Tasdiqlash allaqachon ishlatilgan.", 409);
        certificateId = cert.id;
        fullName = cert.full_name;
      } else fullName = text(req.body.full_name, "Mas’ul shaxs", 3, 100);
      const result = await tx.careerAccount.create({
        data: {
          email: input.email,
          phone: input.phone,
          telegram: input.telegram,
          password_hash,
          full_name: fullName,
          role,
          status: role === "graduate" ? "active" : "pending",
          consent_at: new Date(),
          ...(role === "employer"
            ? {
                company_name: text(req.body.company_name, "Kompaniya", 2, 120),
                industry: text(req.body.industry, "Faoliyat sohasi", 2, 120),
                website: link(req.body.website, "Kompaniya sayti"),
              }
            : {}),
          ...(certificateId
            ? { profile: { create: { certificate_id: certificateId } } }
            : {}),
        },
      });
      await tx.careerEvent.create({
        data: { account_id: result.id, action: "registered" },
      });
      return result;
    });
    await startSession(res, a.id);
    res.status(201).json({ data: safeAccount(a) });
  }),
);
router.post(
  "/login",
  authLimit,
  action(async (req, res) => {
    const email = text(req.body.email, "Email", 5, 254).toLowerCase();
    const password = text(req.body.password, "Parol", 1, 72);
    const a = await prisma.careerAccount.findUnique({ where: { email } });
    if (
      !a ||
      !(await bcrypt.compare(password, a.password_hash)) ||
      a.status === "blocked"
    )
      throw new AppError(
        "Email yoki parol noto‘g‘ri, yoxud hisob bloklangan.",
        401,
      );
    await startSession(res, a.id);
    res.json({ data: safeAccount(a) });
  }),
);
router.use(optionalSession);
router.get(
  "/me",
  requireCareer,
  action(async (req, res) => {
    const profile = await prisma.careerProfile.findUnique({
      where: { account_id: req.career!.id },
      include: {
        certificate: {
          select: {
            serial_number: true,
            full_name: true,
            course_name: true,
            status: true,
          },
        },
      },
    });
    res.json({
      data: {
        account: safeAccount(req.career!),
        profile: profile
          ? { ...profile, completion: completion(profile) }
          : null,
      },
    });
  }),
);
router.post(
  "/logout",
  action(async (req, res) => {
    await prisma.careerSession.deleteMany({
      where: { token_hash: digest(sessionToken(req)) },
    });
    clearSession(res);
    res.json({ success: true });
  }),
);
router.get(
  "/catalog",
  action(async (req, res) => {
    const q =
      typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const where: Prisma.CareerProfileWhereInput = { ...visible };
    if (q) {
      const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
      const matches = await prisma.$queryRaw<
        { id: string }[]
      >`SELECT id FROM career_profiles WHERE EXISTS (SELECT 1 FROM unnest(technologies || skills) AS tag WHERE tag ILIKE ${pattern})`;
      where.OR = [
        { headline: { contains: q, mode: "insensitive" } },
        { certificate: { full_name: { contains: q, mode: "insensitive" } } },
        { certificate: { course_name: { contains: q, mode: "insensitive" } } },
        { id: { in: matches.map((p) => p.id) } },
      ];
    }
    for (const key of [
      "level",
      "city",
      "work_format",
      "work_type",
      "availability",
    ] as const)
      if (typeof req.query[key] === "string" && req.query[key])
        where[key] = String(req.query[key]);
    if (typeof req.query.technology === "string" && req.query.technology)
      where.technologies = { has: req.query.technology };
    const page = Math.floor(
      Math.max(1, Math.min(10000, Number(req.query.page) || 1)),
    );
    const take = 12;
    const [data, total] = await prisma.$transaction([
      prisma.careerProfile.findMany({
        where,
        select: publicSelect,
        orderBy:
          req.query.sort === "name"
            ? { certificate: { full_name: "asc" } }
            : { updated_at: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.careerProfile.count({ where }),
    ]);
    res.json({
      data,
      meta: { total, page, totalPages: Math.ceil(total / take) },
    });
  }),
);
router.get(
  "/summary",
  action(async (_req, res) => {
    const [graduates, employers, profiles] = await prisma.$transaction([
      prisma.careerProfile.count({ where: visible }),
      prisma.careerAccount.count({
        where: { role: "employer", status: "active" },
      }),
      prisma.careerProfile.findMany({
        where: visible,
        select: { technologies: true, city: true },
      }),
    ]);
    res.json({
      data: {
        graduates,
        employers,
        technologies: [
          ...new Set(profiles.flatMap((p) => p.technologies)),
        ].sort(),
        cities: [...new Set(profiles.map((p) => p.city))].sort(),
        demo:
          config.nodeEnv !== "production" && process.env.CAREER_DEMO === "true",
      },
    });
  }),
);
router.get(
  "/profiles/:id",
  action(async (req, res) => {
    const p = await prisma.careerProfile.findFirst({
      where: { ...visible, id: String(req.params.id) },
      select: publicSelect,
    });
    if (!p) throw new AppError("Profil topilmadi yoki hozir yashirilgan.", 404);
    res.json({ data: p });
  }),
);
const contactLimit = rateLimit({
  windowMs: 86400000,
  limit: 50,
  keyGenerator: (req) => (req as CareerRequest).career!.id,
  message: { message: "Bugungi 50 ta kontakt limiti tugadi." },
});
router.post(
  "/profiles/:id/contacts",
  requireCareer,
  approvedEmployer,
  contactLimit,
  action(async (req, res) => {
    const p = await prisma.careerProfile.findFirst({
      where: { ...visible, id: String(req.params.id) },
      select: {
        id: true,
        linkedin: true,
        cv_filename: true,
        account: { select: { phone: true, email: true, telegram: true } },
      },
    });
    if (!p) throw new AppError("Profil topilmadi.", 404);
    await prisma.careerEvent.create({
      data: {
        account_id: req.career!.id,
        action: "contact_viewed",
        target_id: p.id,
      },
    });
    res.json({
      data: { ...p.account, linkedin: p.linkedin, has_cv: !!p.cv_filename },
    });
  }),
);
router.get(
  "/saved",
  requireCareer,
  approvedEmployer,
  action(async (req, res) => {
    const data = await prisma.careerSaved.findMany({
      where: { employer_id: req.career!.id, profile: visible },
      include: { profile: { select: publicSelect } },
      orderBy: { created_at: "desc" },
    });
    res.json({ data: data.map((s) => s.profile) });
  }),
);
router.put(
  "/saved/:id",
  requireCareer,
  approvedEmployer,
  action(async (req, res) => {
    if (
      !(await prisma.careerProfile.findFirst({
        where: { ...visible, id: String(req.params.id) },
      }))
    )
      throw new AppError("Profil topilmadi.", 404);
    const key = {
      employer_id: req.career!.id,
      profile_id: String(req.params.id),
    };
    await prisma.careerSaved.upsert({
      where: { employer_id_profile_id: key },
      create: key,
      update: {},
    });
    res.json({ success: true });
  }),
);
router.delete(
  "/saved/:id",
  requireCareer,
  approvedEmployer,
  action(async (req, res) => {
    await prisma.careerSaved.deleteMany({
      where: { employer_id: req.career!.id, profile_id: String(req.params.id) },
    });
    res.json({ success: true });
  }),
);
router.get(
  "/history",
  requireCareer,
  approvedEmployer,
  action(async (req, res) => {
    res.json({
      data: await prisma.careerEvent.findMany({
        where: { account_id: req.career!.id, action: "contact_viewed" },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
    });
  }),
);
router.post(
  "/profiles/:id/report",
  requireCareer,
  action(async (req, res) => {
    await prisma.careerEvent.create({
      data: {
        account_id: req.career!.id,
        action: "profile_reported",
        target_id: String(req.params.id),
        details: { reason: text(req.body.reason, "Sabab", 10, 1000) },
      },
    });
    res.json({ success: true });
  }),
);
router.put(
  "/profile",
  requireCareer,
  action(async (req, res) => {
    if (req.career!.role !== "graduate")
      throw new AppError("Faqat bitiruvchi uchun.", 403);
    const input = profileInput(req.body);
    const current = await prisma.careerProfile.findUniqueOrThrow({
      where: { account_id: req.career!.id },
      include: { certificate: true },
    });
    const ready =
      completion({ ...current, ...input }) >= 70 &&
      input.headline.length >= 2 &&
      input.bio.length >= 20 &&
      input.city.length >= 2 &&
      input.technologies.length >= 3 &&
      input.skills.length > 0 &&
      input.contact_consent;
    if (
      req.body.published === true &&
      (!ready || current.certificate.status !== "active")
    )
      throw new AppError(
        "E’lon qilish uchun sertifikat faol, profil kamida 70%, 3 ta texnologiya va aloqa roziligi zarur.",
        400,
      );
    const p = await prisma.careerProfile.update({
      where: { id: current.id },
      data: { ...input, published: req.body.published === true },
    });
    res.json({ data: { ...p, completion: completion(p) } });
  }),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
router.post(
  "/profile/avatar",
  requireCareer,
  upload.single("file"),
  action(async (req, res) => {
    if (req.career!.role !== "graduate" || !req.file)
      throw new AppError("Rasm tanlang.", 400);
    const dir = path.join(config.uploadDir, "career-avatars");
    await fs.mkdir(dir, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}.webp`;
    try {
      await sharp(req.file.buffer, { limitInputPixels: 25000000 })
        .rotate()
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(path.join(dir, name));
    } catch {
      throw new AppError(
        "Rasmni o‘qib bo‘lmadi. JPG, PNG yoki WebP yuboring.",
        400,
      );
    }
    const url = `/uploads/career-avatars/${name}`;
    await prisma.careerProfile.update({
      where: { account_id: req.career!.id },
      data: { avatar_url: url },
    });
    res.json({ data: { avatar_url: url } });
  }),
);
router.post(
  "/profile/cv",
  requireCareer,
  upload.single("file"),
  action(async (req, res) => {
    if (
      req.career!.role !== "graduate" ||
      !req.file ||
      !req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))
    )
      throw new AppError("5 MB gacha PDF yuklang.", 400);
    const dir = path.join(process.cwd(), "private-career");
    await fs.mkdir(dir, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}.pdf`;
    await fs.writeFile(path.join(dir, name), req.file.buffer);
    await prisma.careerProfile.update({
      where: { account_id: req.career!.id },
      data: { cv_filename: name },
    });
    res.json({ success: true });
  }),
);
router.get(
  "/profiles/:id/cv",
  requireCareer,
  approvedEmployer,
  contactLimit,
  action(async (req, res) => {
    const p = await prisma.careerProfile.findFirst({
      where: { ...visible, id: String(req.params.id) },
      select: { cv_filename: true },
    });
    if (!p?.cv_filename) throw new AppError("CV topilmadi.", 404);
    await prisma.careerEvent.create({
      data: {
        account_id: req.career!.id,
        action: "cv_downloaded",
        target_id: String(req.params.id),
      },
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ITLive-Career-CV.pdf"',
    );
    res.sendFile(
      path.join(process.cwd(), "private-career", path.basename(p.cv_filename)),
    );
  }),
);
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const known = err instanceof AppError;
  const conflict =
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
  if (!known && !conflict) console.error("Career error:", err.message);
  res
    .status(
      known
        ? err.statusCode
        : conflict
          ? 409
          : err instanceof multer.MulterError
            ? 400
            : 503,
    )
    .json({
      message: known
        ? err.message
        : conflict
          ? "Email yoki sertifikat allaqachon ro‘yxatdan o‘tgan."
          : err instanceof multer.MulterError
            ? "Fayl hajmi 5 MB dan oshmasin."
            : "Xizmat vaqtincha mavjud emas. Qayta urinib ko‘ring.",
    });
});
export default router;
