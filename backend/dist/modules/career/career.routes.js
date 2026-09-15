"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const error_middleware_1 = require("../../middleware/error.middleware");
const career_validation_1 = require("./career.validation");
const career_auth_1 = require("./career.auth");
const router = (0, express_1.Router)();
const action = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const authLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60000,
    limit: 30,
    message: {
        message: "Urinishlar ko‘paydi. 15 daqiqadan keyin qayta urinib ko‘ring.",
    },
});
const visible = {
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
};
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
router.use(career_auth_1.originGuard);
// Operator permissions stay in the existing Verify authentication namespace.
const admin = (0, express_1.Router)();
admin.use(auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("super_admin"));
admin.get("/accounts", action(async (_req, res) => {
    const data = await database_1.prisma.careerAccount.findMany({
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
    res.json({ data: data.map(career_auth_1.safeAccount) });
}));
admin.get("/summary", action(async (_req, res) => {
    const [graduates, employers, pending, blocked, published, events] = await database_1.prisma.$transaction([
        database_1.prisma.careerAccount.count({ where: { role: "graduate" } }),
        database_1.prisma.careerAccount.count({ where: { role: "employer" } }),
        database_1.prisma.careerAccount.count({ where: { status: "pending" } }),
        database_1.prisma.careerAccount.count({ where: { status: "blocked" } }),
        database_1.prisma.careerProfile.count({ where: { published: true } }),
        database_1.prisma.careerEvent.count(),
    ]);
    res.json({
        data: { graduates, employers, pending, blocked, published, events },
    });
}));
admin.post("/invites", action(async (req, res) => {
    const serial = (0, career_validation_1.text)(req.body.serial_number, "Sertifikat raqami", 3, 100);
    const cert = await database_1.prisma.certificate.findFirst({
        where: {
            serial_number: { equals: serial, mode: "insensitive" },
            status: "active",
        },
        include: { career_profile: true },
    });
    if (!cert || cert.career_profile)
        throw new error_middleware_1.AppError("Sertifikat topilmadi yoki allaqachon bog‘langan.", 400);
    const code = (0, crypto_1.randomBytes)(18).toString("base64url");
    await database_1.prisma.$transaction(async (tx) => {
        await tx.careerInvite.updateMany({
            where: { certificate_id: cert.id, consumed_at: null },
            data: { expires_at: new Date() },
        });
        await tx.careerInvite.create({
            data: {
                certificate_id: cert.id,
                code_hash: (0, career_validation_1.digest)(code),
                expires_at: new Date(Date.now() + 7 * 86400000),
            },
        });
        await tx.auditLog.create({
            data: {
                user_id: req.user.id,
                action: "updated",
                certificate_id: cert.id,
                details: { career_action: "invite_issued" },
            },
        });
    });
    res.json({ data: { code, full_name: cert.full_name, expires_in_days: 7 } });
}));
admin.patch("/accounts/:id", action(async (req, res) => {
    const status = (0, career_validation_1.choice)(req.body.status, "Holat", [
        "pending",
        "active",
        "blocked",
    ]);
    await database_1.prisma.$transaction(async (tx) => {
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
                details: { status, admin_id: req.user.id },
            },
        });
    });
    res.json({ success: true });
}));
admin.get("/events", action(async (_req, res) => {
    res.json({
        data: await database_1.prisma.careerEvent.findMany({
            take: 100,
            orderBy: { created_at: "desc" },
            include: {
                account: {
                    select: { full_name: true, email: true, role: true },
                },
            },
        }),
    });
}));
router.use("/admin", admin);
router.post("/eligibility", authLimit, action(async (req, res) => {
    const serial = (0, career_validation_1.text)(req.body.serial_number, "Sertifikat raqami", 3, 100);
    const code = (0, career_validation_1.text)(req.body.code, "Faollashtirish kodi", 10, 100);
    const invite = await database_1.prisma.careerInvite.findUnique({
        where: { code_hash: (0, career_validation_1.digest)(code) },
        include: { certificate: { include: { career_profile: true } } },
    });
    if (!invite ||
        invite.consumed_at ||
        invite.expires_at < new Date() ||
        invite.certificate.status !== "active" ||
        invite.certificate.career_profile ||
        invite.certificate.serial_number.toLowerCase() !== serial.toLowerCase())
        throw new error_middleware_1.AppError("Sertifikat yoki faollashtirish kodi yaroqsiz. Akademiya administratoriga murojaat qiling.", 400);
    const grant = (0, crypto_1.randomBytes)(32).toString("base64url");
    await database_1.prisma.careerInvite.update({
        where: { id: invite.id },
        data: {
            grant_hash: (0, career_validation_1.digest)(grant),
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
}));
router.post("/register", authLimit, action(async (req, res) => {
    const input = (0, career_validation_1.accountInput)(req.body);
    const role = (0, career_validation_1.choice)(req.body.role, "Rol", ["graduate", "employer"]);
    const password_hash = await bcryptjs_1.default.hash(input.password, 12);
    const a = await database_1.prisma.$transaction(async (tx) => {
        let certificateId;
        let fullName;
        if (role === "graduate") {
            const grant = (0, career_validation_1.text)(req.body.grant, "Tekshiruv tasdig‘i", 20, 100);
            const invite = await tx.careerInvite.findUnique({
                where: { grant_hash: (0, career_validation_1.digest)(grant) },
            });
            if (!invite ||
                invite.consumed_at ||
                !invite.grant_expires ||
                invite.grant_expires < new Date() ||
                invite.expires_at < new Date())
                throw new error_middleware_1.AppError("Sertifikatni qayta tekshiring.", 400);
            // Lock the canonical certificate while claiming; concurrent requests cannot claim it twice.
            await tx.$queryRaw `SELECT id FROM certificates WHERE id = ${invite.certificate_id} FOR UPDATE`;
            const cert = await tx.certificate.findUnique({
                where: { id: invite.certificate_id },
                include: { career_profile: true },
            });
            if (!cert || cert.status !== "active" || cert.career_profile)
                throw new error_middleware_1.AppError("Sertifikat yaroqsiz yoki band.", 409);
            const consumed = await tx.careerInvite.updateMany({
                where: {
                    id: invite.id,
                    consumed_at: null,
                    grant_hash: (0, career_validation_1.digest)(grant),
                    grant_expires: { gt: new Date() },
                    expires_at: { gt: new Date() },
                },
                data: { consumed_at: new Date() },
            });
            if (consumed.count !== 1)
                throw new error_middleware_1.AppError("Tasdiqlash allaqachon ishlatilgan.", 409);
            certificateId = cert.id;
            fullName = cert.full_name;
        }
        else
            fullName = (0, career_validation_1.text)(req.body.full_name, "Mas’ul shaxs", 3, 100);
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
                        company_name: (0, career_validation_1.text)(req.body.company_name, "Kompaniya", 2, 120),
                        industry: (0, career_validation_1.text)(req.body.industry, "Faoliyat sohasi", 2, 120),
                        website: (0, career_validation_1.link)(req.body.website, "Kompaniya sayti"),
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
    await (0, career_auth_1.startSession)(res, a.id);
    res.status(201).json({ data: (0, career_auth_1.safeAccount)(a) });
}));
router.post("/login", authLimit, action(async (req, res) => {
    const email = (0, career_validation_1.text)(req.body.email, "Email", 5, 254).toLowerCase();
    const password = (0, career_validation_1.text)(req.body.password, "Parol", 1, 72);
    const a = await database_1.prisma.careerAccount.findUnique({ where: { email } });
    if (!a ||
        !(await bcryptjs_1.default.compare(password, a.password_hash)) ||
        a.status === "blocked")
        throw new error_middleware_1.AppError("Email yoki parol noto‘g‘ri, yoxud hisob bloklangan.", 401);
    await (0, career_auth_1.startSession)(res, a.id);
    res.json({ data: (0, career_auth_1.safeAccount)(a) });
}));
router.use(career_auth_1.optionalSession);
router.get("/me", career_auth_1.requireCareer, action(async (req, res) => {
    const profile = await database_1.prisma.careerProfile.findUnique({
        where: { account_id: req.career.id },
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
            account: (0, career_auth_1.safeAccount)(req.career),
            profile: profile
                ? { ...profile, completion: (0, career_validation_1.completion)(profile) }
                : null,
        },
    });
}));
router.post("/logout", action(async (req, res) => {
    await database_1.prisma.careerSession.deleteMany({
        where: { token_hash: (0, career_validation_1.digest)((0, career_auth_1.sessionToken)(req)) },
    });
    (0, career_auth_1.clearSession)(res);
    res.json({ success: true });
}));
router.get("/catalog", action(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const where = { ...visible };
    if (q) {
        const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
        const matches = await database_1.prisma.$queryRaw `SELECT id FROM career_profiles WHERE EXISTS (SELECT 1 FROM unnest(technologies || skills) AS tag WHERE tag ILIKE ${pattern})`;
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
    ])
        if (typeof req.query[key] === "string" && req.query[key])
            where[key] = String(req.query[key]);
    if (typeof req.query.technology === "string" && req.query.technology)
        where.technologies = { has: req.query.technology };
    const page = Math.floor(Math.max(1, Math.min(10000, Number(req.query.page) || 1)));
    const take = 12;
    const [data, total] = await database_1.prisma.$transaction([
        database_1.prisma.careerProfile.findMany({
            where,
            select: publicSelect,
            orderBy: req.query.sort === "name"
                ? { certificate: { full_name: "asc" } }
                : { updated_at: "desc" },
            skip: (page - 1) * take,
            take,
        }),
        database_1.prisma.careerProfile.count({ where }),
    ]);
    res.json({
        data,
        meta: { total, page, totalPages: Math.ceil(total / take) },
    });
}));
router.get("/summary", action(async (_req, res) => {
    const [graduates, employers, profiles] = await database_1.prisma.$transaction([
        database_1.prisma.careerProfile.count({ where: visible }),
        database_1.prisma.careerAccount.count({
            where: { role: "employer", status: "active" },
        }),
        database_1.prisma.careerProfile.findMany({
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
            demo: env_1.config.nodeEnv !== "production" && process.env.CAREER_DEMO === "true",
        },
    });
}));
router.get("/profiles/:id", action(async (req, res) => {
    const p = await database_1.prisma.careerProfile.findFirst({
        where: { ...visible, id: String(req.params.id) },
        select: publicSelect,
    });
    if (!p)
        throw new error_middleware_1.AppError("Profil topilmadi yoki hozir yashirilgan.", 404);
    res.json({ data: p });
}));
const contactLimit = (0, express_rate_limit_1.default)({
    windowMs: 86400000,
    limit: 50,
    keyGenerator: (req) => req.career.id,
    message: { message: "Bugungi 50 ta kontakt limiti tugadi." },
});
router.post("/profiles/:id/contacts", career_auth_1.requireCareer, career_auth_1.approvedEmployer, contactLimit, action(async (req, res) => {
    const p = await database_1.prisma.careerProfile.findFirst({
        where: { ...visible, id: String(req.params.id) },
        select: {
            id: true,
            linkedin: true,
            cv_filename: true,
            account: { select: { phone: true, email: true, telegram: true } },
        },
    });
    if (!p)
        throw new error_middleware_1.AppError("Profil topilmadi.", 404);
    await database_1.prisma.careerEvent.create({
        data: {
            account_id: req.career.id,
            action: "contact_viewed",
            target_id: p.id,
        },
    });
    res.json({
        data: { ...p.account, linkedin: p.linkedin, has_cv: !!p.cv_filename },
    });
}));
router.get("/saved", career_auth_1.requireCareer, career_auth_1.approvedEmployer, action(async (req, res) => {
    const data = await database_1.prisma.careerSaved.findMany({
        where: { employer_id: req.career.id, profile: visible },
        include: { profile: { select: publicSelect } },
        orderBy: { created_at: "desc" },
    });
    res.json({ data: data.map((s) => s.profile) });
}));
router.put("/saved/:id", career_auth_1.requireCareer, career_auth_1.approvedEmployer, action(async (req, res) => {
    if (!(await database_1.prisma.careerProfile.findFirst({
        where: { ...visible, id: String(req.params.id) },
    })))
        throw new error_middleware_1.AppError("Profil topilmadi.", 404);
    const key = {
        employer_id: req.career.id,
        profile_id: String(req.params.id),
    };
    await database_1.prisma.careerSaved.upsert({
        where: { employer_id_profile_id: key },
        create: key,
        update: {},
    });
    res.json({ success: true });
}));
router.delete("/saved/:id", career_auth_1.requireCareer, career_auth_1.approvedEmployer, action(async (req, res) => {
    await database_1.prisma.careerSaved.deleteMany({
        where: { employer_id: req.career.id, profile_id: String(req.params.id) },
    });
    res.json({ success: true });
}));
router.get("/history", career_auth_1.requireCareer, career_auth_1.approvedEmployer, action(async (req, res) => {
    res.json({
        data: await database_1.prisma.careerEvent.findMany({
            where: { account_id: req.career.id, action: "contact_viewed" },
            orderBy: { created_at: "desc" },
            take: 50,
        }),
    });
}));
router.post("/profiles/:id/report", career_auth_1.requireCareer, action(async (req, res) => {
    await database_1.prisma.careerEvent.create({
        data: {
            account_id: req.career.id,
            action: "profile_reported",
            target_id: String(req.params.id),
            details: { reason: (0, career_validation_1.text)(req.body.reason, "Sabab", 10, 1000) },
        },
    });
    res.json({ success: true });
}));
router.put("/profile", career_auth_1.requireCareer, action(async (req, res) => {
    if (req.career.role !== "graduate")
        throw new error_middleware_1.AppError("Faqat bitiruvchi uchun.", 403);
    const input = (0, career_validation_1.profileInput)(req.body);
    const current = await database_1.prisma.careerProfile.findUniqueOrThrow({
        where: { account_id: req.career.id },
        include: { certificate: true },
    });
    const ready = (0, career_validation_1.completion)({ ...current, ...input }) >= 70 &&
        input.headline.length >= 2 &&
        input.bio.length >= 20 &&
        input.city.length >= 2 &&
        input.technologies.length >= 3 &&
        input.skills.length > 0 &&
        input.contact_consent;
    if (req.body.published === true &&
        (!ready || current.certificate.status !== "active"))
        throw new error_middleware_1.AppError("E’lon qilish uchun sertifikat faol, profil kamida 70%, 3 ta texnologiya va aloqa roziligi zarur.", 400);
    const p = await database_1.prisma.careerProfile.update({
        where: { id: current.id },
        data: { ...input, published: req.body.published === true },
    });
    res.json({ data: { ...p, completion: (0, career_validation_1.completion)(p) } });
}));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
router.post("/profile/avatar", career_auth_1.requireCareer, upload.single("file"), action(async (req, res) => {
    if (req.career.role !== "graduate" || !req.file)
        throw new error_middleware_1.AppError("Rasm tanlang.", 400);
    const dir = path_1.default.join(env_1.config.uploadDir, "career-avatars");
    await promises_1.default.mkdir(dir, { recursive: true });
    const name = `${(0, crypto_1.randomBytes)(16).toString("hex")}.webp`;
    try {
        await (0, sharp_1.default)(req.file.buffer, { limitInputPixels: 25000000 })
            .rotate()
            .resize(512, 512, { fit: "cover" })
            .webp({ quality: 85 })
            .toFile(path_1.default.join(dir, name));
    }
    catch {
        throw new error_middleware_1.AppError("Rasmni o‘qib bo‘lmadi. JPG, PNG yoki WebP yuboring.", 400);
    }
    const url = `/uploads/career-avatars/${name}`;
    await database_1.prisma.careerProfile.update({
        where: { account_id: req.career.id },
        data: { avatar_url: url },
    });
    res.json({ data: { avatar_url: url } });
}));
router.post("/profile/cv", career_auth_1.requireCareer, upload.single("file"), action(async (req, res) => {
    if (req.career.role !== "graduate" ||
        !req.file ||
        !req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-")))
        throw new error_middleware_1.AppError("5 MB gacha PDF yuklang.", 400);
    const dir = path_1.default.join(process.cwd(), "private-career");
    await promises_1.default.mkdir(dir, { recursive: true });
    const name = `${(0, crypto_1.randomBytes)(16).toString("hex")}.pdf`;
    await promises_1.default.writeFile(path_1.default.join(dir, name), req.file.buffer);
    await database_1.prisma.careerProfile.update({
        where: { account_id: req.career.id },
        data: { cv_filename: name },
    });
    res.json({ success: true });
}));
router.get("/profiles/:id/cv", career_auth_1.requireCareer, career_auth_1.approvedEmployer, contactLimit, action(async (req, res) => {
    const p = await database_1.prisma.careerProfile.findFirst({
        where: { ...visible, id: String(req.params.id) },
        select: { cv_filename: true },
    });
    if (!p?.cv_filename)
        throw new error_middleware_1.AppError("CV topilmadi.", 404);
    await database_1.prisma.careerEvent.create({
        data: {
            account_id: req.career.id,
            action: "cv_downloaded",
            target_id: String(req.params.id),
        },
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="ITLive-Career-CV.pdf"');
    res.sendFile(path_1.default.join(process.cwd(), "private-career", path_1.default.basename(p.cv_filename)));
}));
router.use((err, _req, res, _next) => {
    const known = err instanceof error_middleware_1.AppError;
    const conflict = err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (!known && !conflict)
        console.error("Career error:", err.message);
    res
        .status(known
        ? err.statusCode
        : conflict
            ? 409
            : err instanceof multer_1.default.MulterError
                ? 400
                : 503)
        .json({
        message: known
            ? err.message
            : conflict
                ? "Email yoki sertifikat allaqachon ro‘yxatdan o‘tgan."
                : err instanceof multer_1.default.MulterError
                    ? "Fayl hajmi 5 MB dan oshmasin."
                    : "Xizmat vaqtincha mavjud emas. Qayta urinib ko‘ring.",
    });
});
exports.default = router;
//# sourceMappingURL=career.routes.js.map