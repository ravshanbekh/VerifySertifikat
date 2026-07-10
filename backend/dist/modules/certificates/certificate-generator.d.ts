export declare const COURSE_SERIES_MAP: Record<string, {
    prefix: string;
    description: string;
}>;
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
export declare function generateCertificateImage(options: GenerateOptions, outputPath: string): Promise<void>;
/**
 * PNG faylni PDF ga aylantirish (1 sahifali).
 */
export declare function convertPngToPdf(pngPath: string, pdfPath: string): Promise<void>;
export {};
//# sourceMappingURL=certificate-generator.d.ts.map