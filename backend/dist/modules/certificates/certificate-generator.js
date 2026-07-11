"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COURSE_SERIES_MAP = void 0;
exports.generateCertificateImage = generateCertificateImage;
exports.convertPngToPdf = convertPngToPdf;
const sharp_1 = __importDefault(require("sharp"));
const pdf_lib_1 = require("pdf-lib");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ASSETS_DIR = path_1.default.join(__dirname, '../../../assets');
const TEMPLATE_PATH = path_1.default.join(ASSETS_DIR, 'certificate-template.png');
const FONTS_DIR = path_1.default.join(ASSETS_DIR, 'fonts');
// Kurs yo'nalishlari mapping (moslashuvchan — yangi qo'shish mumkin)
exports.COURSE_SERIES_MAP = {
    'Kiberxavfsizlik': {
        prefix: 'KB',
        description: 'Kiberxavfsizlik kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Kiberxavfsizlik" o\'quv kursini muvaffaqiyatli tamomlab, axborot xavfsizligi tamoyillari, tarmoq va tizimlar xavfsizligi, zararli dasturlar va kiberhujumlardan himoyalanish, xavfsiz autentifikatsiya, ma\'lumotlarni himoyalash, xavflarni boshqarish hamda zamonaviy kiberxavfsizlik amaliyotlari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Frontend': {
        prefix: 'FE',
        description: 'Frontend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Frontend Development" o\'quv kursini muvaffaqiyatli tamomlab, HTML, CSS, JavaScript, React va zamonaviy veb-texnologiyalar bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Frontend Development': {
        prefix: 'FE',
        description: 'Frontend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Frontend Development" o\'quv kursini muvaffaqiyatli tamomlab, HTML, CSS, JavaScript, React va zamonaviy veb-texnologiyalar bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Backend': {
        prefix: 'BE',
        description: 'Backend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Backend Development" o\'quv kursini muvaffaqiyatli tamomlab, server-side dasturlash, ma\'lumotlar bazalari, API yaratish va zamonaviy backend texnologiyalari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Backend Development': {
        prefix: 'BE',
        description: 'Backend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Backend Development" o\'quv kursini muvaffaqiyatli tamomlab, server-side dasturlash, ma\'lumotlar bazalari, API yaratish va zamonaviy backend texnologiyalari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Kompyuter savodxonligi': {
        prefix: 'KS',
        description: 'Kompyuter savodxonligi kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Kompyuter savodxonligi" o\'quv kursini muvaffaqiyatli tamomlab, kompyuter asoslari, ofis dasturlari, internet xavfsizligi va axborot texnologiyalari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'IT Kids': {
        prefix: 'IK',
        description: 'IT Kids kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "IT Kids" o\'quv kursini muvaffaqiyatli tamomlab, boshlang\'ich kompyuter savodxonligi, mantiqiy fikrlash va dasturlash asoslari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Veb dasturlash': {
        prefix: 'VD',
        description: 'Veb dasturlash kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Veb dasturlash" o\'quv kursini muvaffaqiyatli tamomlab, veb-saytlar va ilovalar yaratish, HTML/CSS, JavaScript, ma\'lumotlar bazalari hamda backend dasturlash bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
    'Foundation': {
        prefix: 'FN',
        description: 'Foundation kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Foundation" o\'quv kursini muvaffaqiyatli tamomlab, dasturlash asoslari, mantiq, algoritmlar va ma\'lumotlar tuzilmalari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlaydi.',
    },
};
// Matnni chiziqqa bo'lib qo'yish (word wrap)
function wrapText(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        if ((current + ' ' + word).trim().length > maxCharsPerLine) {
            if (current)
                lines.push(current.trim());
            current = word;
        }
        else {
            current = (current + ' ' + word).trim();
        }
    }
    if (current)
        lines.push(current.trim());
    return lines;
}
// Sanani formatlash: 07.07.2026
function formatDate(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
}
// HTML entity encode
function he(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/**
 * Sertifikat PNG generatsiya qilish.
 * Shablon rasm ustiga dinamik matnlar (SVG overlay) joylashtiriladi.
 * QR kod, imzo, muhr — hammasi shablon ichida (o'zgarmaydi).
 */
async function generateCertificateImage(options, outputPath) {
    const { fullName, courseName, courseDescription, courseEndDate, serialNumber } = options;
    // Shablon o'lchamini aniqlash
    const templateMeta = await (0, sharp_1.default)(TEMPLATE_PATH).metadata();
    const W = templateMeta.width || 1024;
    const H = templateMeta.height || 725;
    // Kurs tavsifi qatorlarga bo'lish
    const descLines = courseDescription.split('\n');
    const wrappedDesc = [];
    for (const line of descLines) {
        if (line.trim() === '') {
            wrappedDesc.push('');
        }
        else {
            // 205px dan boshlab stripesgacha kengaytirish uchun 100 belgi qildik
            wrappedDesc.push(...wrapText(line, 100));
        }
    }
    const descFontSize = 50; // 12 pt at 300 DPI = 50 px
    const descLineHeight = 67; // 16 pt at 300 DPI = 67 px
    const descStartY = 1380; // Teparoqqa surilgan
    const descX = 205; // Qizil hoshiya chizig'iga moslandi (260 dan 205 ga)
    // Kurs tavsifi SVG qatorlari
    const descSvgLines = wrappedDesc
        .map((line, i) => {
        const y = descStartY + i * descLineHeight;
        let lineContent = he(line);
        // Birinchi qator boshidagi kurs nomini qalin (bold) qilish
        if (i === 0 && line.startsWith(courseName)) {
            const rest = line.substring(courseName.length);
            lineContent = `<tspan font-weight="700">${he(courseName)}</tspan>${he(rest)}`;
        }
        return `<text x="${descX}" y="${y}" font-size="${descFontSize}" fill="#00182C" font-family="Noto Sans" font-weight="400">${lineContent}</text>`;
    })
        .join('\n');
    const nameFontSize = 240; // Ism o'lchami
    const nameY = 1180; // Teparoqqa surilgan
    const nameX = 205; // Qizil hoshiya chizig'iga moslandi (260 dan 205 ga)
    // Sana va seriya raqami (PSD o'lchamlariga moslangan)
    const dateY = 2030; // Chiziqqa yaqinlashtirildi (2010 dan 2030 ga)
    const dateX = 2140; // PSD ruler bo'yicha X = 2140 px
    const serialY = 2280; // Linkni to'sib qo'ymasligi uchun pastga tushirildi (2210 dan 2280 ga)
    const serialX = 2140; // PSD ruler bo'yicha X = 2140 px
    const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- Ism (Great Vibes) -->
  <text
    x="${nameX}"
    y="${nameY}"
    font-size="${nameFontSize}"
    fill="#00182C"
    font-family="Great Vibes"
    font-weight="400"
  >${he(fullName)}</text>

  <!-- Kurs tavsifi -->
  ${descSvgLines}

  <!-- Sana (Roboto Regular) -->
  <text x="${dateX}" y="${dateY}" font-size="72" fill="#00182C" font-family="Noto Sans" font-weight="400">${he(formatDate(courseEndDate))}</text>

  <!-- Seriya raqami (Roboto Bold) -->
  <text x="${serialX}" y="${serialY}" font-size="72" fill="#00182C" font-family="Noto Sans" font-weight="700">${he(serialNumber)}</text>
</svg>`.trim();
    const svgBuffer = Buffer.from(svgOverlay);
    // Shablon + overlay birlashtirish va PNG saqlash
    await (0, sharp_1.default)(TEMPLATE_PATH)
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .png({ quality: 95 })
        .toFile(outputPath);
}
/**
 * PNG faylni PDF ga aylantirish (1 sahifali).
 */
async function convertPngToPdf(pngPath, pdfPath) {
    const pngBuffer = fs_1.default.readFileSync(pngPath);
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(pngBuffer);
    // A4 landscape: 841.89 x 595.28 pt
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();
    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width,
        height,
    });
    const pdfBytes = await pdfDoc.save();
    fs_1.default.writeFileSync(pdfPath, pdfBytes);
}
//# sourceMappingURL=certificate-generator.js.map