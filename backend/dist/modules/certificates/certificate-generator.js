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
        description: 'Kiberxavfsizlik kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Kiberxavfsizlik" o\'quv kursini muvaffaqiyatli tamomlab, axborot xavfsizligi tamoyillari, tarmoq va tizimlar xavfsizligi, zararli dasturlar va kiberhujumlardan himoyalanish, xavfsiz autentifikatsiya, ma\'lumotlarni himoyalash, xavflarni boshqarish hamda zamonaviy kiberxavfsizlik amaliyotlari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.',
    },
    'Frontend Development': {
        prefix: 'FR',
        description: 'Frontend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Frontend Development" o\'quv kursini muvaffaqiyatli tamomlab, HTML, CSS, JavaScript, React va zamonaviy veb-texnologiyalar bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.',
    },
    'Backend Development': {
        prefix: 'BC',
        description: 'Backend Development kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Backend Development" o\'quv kursini muvaffaqiyatli tamomlab, server-side dasturlash, ma\'lumotlar bazalari, API yaratish va zamonaviy backend texnologiyalari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.',
    },
    'Kompyuter savodxonligi': {
        prefix: 'KS',
        description: 'Kompyuter savodxonligi kursini muvaffaqiyatli tamomlaganligi uchun ushbu sertifikat bilan taqdirlanadi.\nMazkur sertifikat egasi "Kompyuter savodxonligi" o\'quv kursini muvaffaqiyatli tamomlab, kompyuter asoslari, ofis dasturlari, internet xavfsizligi va axborot texnologiyalari bo\'yicha nazariy bilim, amaliy ko\'nikma va professional kompetensiyalarni egallaganligini tasdiqlayd i.',
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
            // 95 belgi — 1024px kenglikda to'g'ri sig'adi
            wrappedDesc.push(...wrapText(line, 95));
        }
    }
    const descFontSize = 13;
    const descLineHeight = 19;
    const descStartY = H * 0.56; // Shablon bo'yicha ~406px
    const descX = W * 0.05; // Chap chekka ~51px
    // Kurs tavsifi SVG satrlari
    const descSvgLines = wrappedDesc
        .map((line, i) => {
        const y = descStartY + i * descLineHeight;
        return `<text x="${descX}" y="${y}" font-size="${descFontSize}" fill="#1C232C" font-family="Arial, Helvetica, sans-serif" font-weight="400">${he(line)}</text>`;
    })
        .join('\n');
    // Ism (Great Vibes shriftini SVG embed qilamiz)
    // Great Vibes TTF ni base64 ga aylantirish
    const fontPath = path_1.default.join(FONTS_DIR, 'GreatVibes-Regular.ttf');
    let fontBase64 = '';
    if (fs_1.default.existsSync(fontPath)) {
        fontBase64 = fs_1.default.readFileSync(fontPath).toString('base64');
    }
    const nameFontSize = 58;
    const nameY = H * 0.46; // ~333px
    const nameX = W * 0.04; // ~41px
    // Sana va seriya raqami (pastki qism)
    const dateY = H * 0.835; // ~605px
    const dateX = W * 0.62; // ~635px
    const serialY = H * 0.875; // ~634px
    const serialX = W * 0.62;
    const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  ${fontBase64 ? `
  <defs>
    <style>
      @font-face {
        font-family: 'GreatVibes';
        src: url('data:font/truetype;base64,${fontBase64}');
        font-weight: normal;
        font-style: normal;
      }
    </style>
  </defs>
  ` : ''}

  <!-- Ism (Great Vibes) -->
  <text
    x="${nameX}"
    y="${nameY}"
    font-size="${nameFontSize}"
    fill="#1C232C"
    font-family="${fontBase64 ? 'GreatVibes' : 'Georgia, serif'}"
    font-style="${fontBase64 ? 'normal' : 'italic'}"
    font-weight="400"
  >${he(fullName)}</text>

  <!-- Kurs tavsifi -->
  ${descSvgLines}

  <!-- Sana -->
  <text x="${dateX}" y="${dateY}" font-size="14" fill="#1C232C" font-family="Arial, Helvetica, sans-serif" font-weight="700">${he(formatDate(courseEndDate))}</text>

  <!-- Seriya raqami -->
  <text x="${serialX}" y="${serialY}" font-size="15" fill="#1C232C" font-family="Arial, Helvetica, sans-serif" font-weight="900" letter-spacing="1">${he(serialNumber)}</text>
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