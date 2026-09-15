"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.digest = void 0;
exports.text = text;
exports.choice = choice;
exports.tags = tags;
exports.link = link;
exports.accountInput = accountInput;
exports.profileInput = profileInput;
exports.completion = completion;
const error_middleware_1 = require("../../middleware/error.middleware");
const crypto_1 = require("crypto");
const digest = (value) => (0, crypto_1.createHash)("sha256").update(value).digest("hex");
exports.digest = digest;
function text(value, name, min = 0, max = 250) {
    if (typeof value !== "string" ||
        value.trim().length < min ||
        value.trim().length > max)
        throw new error_middleware_1.AppError(`${name}: ${min}–${max} belgi kiriting.`, 400);
    return value.trim();
}
function choice(value, name, options) {
    const result = text(value, name, 1);
    if (!options.includes(result))
        throw new error_middleware_1.AppError(`${name} noto‘g‘ri.`, 400);
    return result;
}
function tags(value, name) {
    if (!Array.isArray(value) || value.length > 20)
        throw new error_middleware_1.AppError(`${name}: ko‘pi bilan 20 ta.`, 400);
    return [...new Set(value.map((v) => text(v, name, 1, 60)))];
}
function link(value, name, host) {
    const result = text(value ?? "", name, 0, 500);
    if (!result)
        return "";
    try {
        const url = new URL(result);
        if (url.protocol !== "https:" ||
            url.username ||
            url.password ||
            (host && url.hostname !== host && url.hostname !== `www.${host}`))
            throw new Error();
    }
    catch {
        throw new error_middleware_1.AppError(`${name}: to‘liq https:// havolani kiriting.`, 400);
    }
    return result;
}
function accountInput(body) {
    const email = text(body.email, "Email", 5, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new error_middleware_1.AppError("Email noto‘g‘ri.", 400);
    const password = text(body.password, "Parol", 10, 72);
    if (Buffer.byteLength(password) > 72)
        throw new error_middleware_1.AppError("Parol 72 baytdan oshmasin.", 400);
    const phone = text(body.phone, "Telefon", 9, 20).replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{8,14}$/.test(phone))
        throw new error_middleware_1.AppError("Telefonni +998 bilan kiriting.", 400);
    const telegram = text(body.telegram, "Telegram", 5, 80)
        .replace(/^https:\/\/t\.me\//, "")
        .replace(/^@/, "");
    if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram))
        throw new error_middleware_1.AppError("Telegram foydalanuvchi nomi noto‘g‘ri.", 400);
    if (body.consent !== true)
        throw new error_middleware_1.AppError("Ma’lumotlardan foydalanishga rozilik zarur.", 400);
    return { email, password, phone, telegram };
}
function profileInput(body) {
    if (!Array.isArray(body.projects) || body.projects.length > 8)
        throw new error_middleware_1.AppError("Ko‘pi bilan 8 ta loyiha kiriting.", 400);
    return {
        headline: text(body.headline, "Mutaxassislik", 0, 100),
        bio: text(body.bio, "O‘zingiz haqingizda", 0, 3000),
        city: text(body.city, "Shahar", 0, 80),
        level: choice(body.level, "Daraja", [
            "Intern",
            "Junior",
            "Middle",
            "Senior",
        ]),
        work_format: choice(body.work_format, "Ish formati", [
            "Remote",
            "Office",
            "Hybrid",
        ]),
        work_type: choice(body.work_type, "Ish turi", [
            "Full-time",
            "Part-time",
            "Internship",
            "Freelance",
        ]),
        availability: choice(body.availability, "Holat", [
            "open",
            "offers",
            "busy",
        ]),
        technologies: tags(body.technologies, "Texnologiyalar"),
        skills: tags(body.skills, "Ko‘nikmalar"),
        languages: tags(body.languages, "Tillar"),
        experience: text(body.experience, "Tajriba", 0, 5000),
        projects: body.projects.map((p) => ({
            name: text(p.name, "Loyiha nomi", 1, 100),
            description: text(p.description ?? "", "Tavsif", 0, 1000),
            url: link(p.url, "Loyiha havolasi"),
        })),
        linkedin: link(body.linkedin, "LinkedIn", "linkedin.com"),
        github: link(body.github, "GitHub", "github.com"),
        portfolio: link(body.portfolio, "Portfolio"),
        contact_consent: body.contact_consent === true,
    };
}
function completion(p) {
    const essentials = [
        !!p.headline,
        p.bio.length >= 20,
        !!p.city,
        p.technologies.length >= 3,
        p.skills.length > 0,
        p.contact_consent,
    ];
    const extras = [
        !!p.avatar_url,
        Array.isArray(p.projects) && p.projects.length > 0,
        p.languages.length > 0,
        !!(p.linkedin || p.github),
    ];
    return (essentials.filter(Boolean).length * 12 + extras.filter(Boolean).length * 7);
}
//# sourceMappingURL=career.validation.js.map