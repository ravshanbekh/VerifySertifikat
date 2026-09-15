import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { CareerAccount } from "@prisma/client";
import { prisma } from "../../config/database";
import { config } from "../../config/env";
import { AppError } from "../../middleware/error.middleware";
import { digest } from "./career.validation";

export interface CareerRequest extends Request {
  career?: CareerAccount;
}
const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/api/career",
};
export function sessionToken(req: Request) {
  return (
    (req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("career_session="))
      ?.slice(15) || ""
  );
}
export async function startSession(res: Response, accountId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.careerSession.create({
    data: {
      token_hash: digest(token),
      account_id: accountId,
      expires_at: new Date(Date.now() + 7 * 86400000),
    },
  });
  res.cookie("career_session", token, {
    ...cookieOptions,
    maxAge: 7 * 86400000,
  });
}
export function clearSession(res: Response) {
  res.clearCookie("career_session", cookieOptions);
}
export async function optionalSession(
  req: CareerRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = sessionToken(req);
    if (token) {
      const session = await prisma.careerSession.findUnique({
        where: { token_hash: digest(token) },
        include: { account: true },
      });
      if (
        session &&
        session.expires_at > new Date() &&
        session.account.status !== "blocked"
      )
        req.career = session.account;
    }
    next();
  } catch (err) {
    next(err);
  }
}
export function requireCareer(
  req: CareerRequest,
  _res: Response,
  next: NextFunction,
) {
  next(
    req.career
      ? undefined
      : new AppError("Davom etish uchun hisobingizga kiring.", 401),
  );
}
export function approvedEmployer(
  req: CareerRequest,
  _res: Response,
  next: NextFunction,
) {
  next(
    req.career?.role === "employer" && req.career.status === "active"
      ? undefined
      : new AppError("Bu imkoniyat tasdiqlangan ish beruvchilar uchun.", 403),
  );
}
export function safeAccount(a: CareerAccount) {
  const { password_hash: _secret, ...account } = a;
  return account;
}
export function originGuard(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  // Require an exact trusted origin even for same-site sibling subdomains.
  const allowed = [config.frontendUrl, config.careerUrl];
  if (!origin || !allowed.includes(origin))
    return next(new AppError("So‘rov manbasi ruxsat etilmagan.", 403));
  next();
}
