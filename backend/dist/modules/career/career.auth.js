"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionToken = sessionToken;
exports.startSession = startSession;
exports.clearSession = clearSession;
exports.optionalSession = optionalSession;
exports.requireCareer = requireCareer;
exports.approvedEmployer = approvedEmployer;
exports.safeAccount = safeAccount;
exports.originGuard = originGuard;
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const error_middleware_1 = require("../../middleware/error.middleware");
const career_validation_1 = require("./career.validation");
const cookieOptions = {
    httpOnly: true,
    secure: env_1.config.nodeEnv === "production",
    sameSite: "lax",
    path: "/api/career",
};
function sessionToken(req) {
    return ((req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("career_session="))
        ?.slice(15) || "");
}
async function startSession(res, accountId) {
    const token = (0, crypto_1.randomBytes)(32).toString("base64url");
    await database_1.prisma.careerSession.create({
        data: {
            token_hash: (0, career_validation_1.digest)(token),
            account_id: accountId,
            expires_at: new Date(Date.now() + 7 * 86400000),
        },
    });
    res.cookie("career_session", token, {
        ...cookieOptions,
        maxAge: 7 * 86400000,
    });
}
function clearSession(res) {
    res.clearCookie("career_session", cookieOptions);
}
async function optionalSession(req, _res, next) {
    try {
        const token = sessionToken(req);
        if (token) {
            const session = await database_1.prisma.careerSession.findUnique({
                where: { token_hash: (0, career_validation_1.digest)(token) },
                include: { account: true },
            });
            if (session &&
                session.expires_at > new Date() &&
                session.account.status !== "blocked")
                req.career = session.account;
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
function requireCareer(req, _res, next) {
    next(req.career
        ? undefined
        : new error_middleware_1.AppError("Davom etish uchun hisobingizga kiring.", 401));
}
function approvedEmployer(req, _res, next) {
    next(req.career?.role === "employer" && req.career.status === "active"
        ? undefined
        : new error_middleware_1.AppError("Bu imkoniyat tasdiqlangan ish beruvchilar uchun.", 403));
}
function safeAccount(a) {
    const { password_hash: _secret, ...account } = a;
    return account;
}
function originGuard(req, _res, next) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method))
        return next();
    const origin = req.headers.origin;
    // Require an exact trusted origin even for same-site sibling subdomains.
    const allowed = [env_1.config.frontendUrl, env_1.config.careerUrl];
    if (!origin || !allowed.includes(origin))
        return next(new error_middleware_1.AppError("So‘rov manbasi ruxsat etilmagan.", 403));
    next();
}
//# sourceMappingURL=career.auth.js.map