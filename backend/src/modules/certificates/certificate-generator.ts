import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

const ASSETS_DIR = path.join(__dirname, '../../../assets');
const TEMPLATE_PATH = path.join(ASSETS_DIR, 'certificate-template.png');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');

// Kurs yo'nalishlari mapping (moslashuvchan — yangi qo'shish mumkin)
export const COURSE_SERIES_MAP: Record<string, { prefix: string; description: string }> = {
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
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

// Sanani formatlash: 07.07.2026
function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

// HTML entity encode
function he(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface GenerateOptions {
  fullName: string;
  courseName: string;
  courseDescription: string;
  courseEndDate: Date;
  serialNumber: string;
}

/**
 * Sertifikat PNG generatsiya qilish.
 * Shablon rasm ustiga dinamik matnlar (SVG overlay) joylashtiriladi.
 * QR kod, imzo, muhr — hammasi shablon ichida (o'zgarmaydi).
 */
export async function generateCertificateImage(
  options: GenerateOptions,
  outputPath: string,
): Promise<void> {
  const { fullName, courseName, courseDescription, courseEndDate, serialNumber } = options;

  // Shablon o'lchamini aniqlash
  const templateMeta = await sharp(TEMPLATE_PATH).metadata();
  const W = templateMeta.width || 1024;
  const H = templateMeta.height || 725;

  // Kurs tavsifi qatorlarga bo'lish
  const descLines = courseDescription.split('\n');
  const wrappedDesc: string[] = [];
  for (const line of descLines) {
    if (line.trim() === '') {
      wrappedDesc.push('');
    } else {
      // 3507px kenglikda, 50px font bilan ~85 belgi sig'adi
      wrappedDesc.push(...wrapText(line, 85));
    }
  }

  const descFontSize = 50;     // 12 pt at 300 DPI = 50 px
  const descLineHeight = 67;   // 16 pt at 300 DPI = 67 px
  const descStartY = 1440;     // PSD ruler bo'yicha Y = 1440 px
  const descX = 260;           // PSD ruler bo'yicha X = 260 px

  // Kurs tavsifi SVG qatorlari
  const descSvgLines = wrappedDesc
    .map((line, i) => {
      const y = descStartY + i * descLineHeight;
      return `<text x="${descX}" y="${y}" font-size="${descFontSize}" fill="#00182C" font-family="Noto Sans" font-weight="400">${he(line)}</text>`;
    })
    .join('\n');

  const nameFontSize = 288;    // 69.08 pt at 300 DPI = 288 px
  const nameY = 1280;          // PSD ruler bo'yicha Y = 1280 px
  const nameX = 260;           // PSD ruler bo'yicha X = 260 px

  // Sana va seriya raqami (PSD o'lchamlariga moslangan)
  const dateY = 2010;          // PSD ruler bo'yicha Y = 2010 px
  const dateX = 2140;          // PSD ruler bo'yicha X = 2140 px
  const serialY = 2210;        // PSD ruler bo'yicha Y = 2210 px
  const serialX = 2140;        // PSD ruler bo'yicha X = 2140 px

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
  await sharp(TEMPLATE_PATH)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toFile(outputPath);
}

/**
 * PNG faylni PDF ga aylantirish (1 sahifali).
 */
export async function convertPngToPdf(pngPath: string, pdfPath: string): Promise<void> {
  const pngBuffer = fs.readFileSync(pngPath);

  const pdfDoc = await PDFDocument.create();
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
  fs.writeFileSync(pdfPath, pdfBytes);
}
