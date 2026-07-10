"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed() {
    console.log('🌱 Seed boshlanmoqda...');
    // Super admin yaratish
    const email = 'admin@itlive.uz';
    const existing = await database_1.prisma.user.findUnique({ where: { email } });
    if (!existing) {
        const password_hash = await bcryptjs_1.default.hash('Admin@123456', 12);
        const admin = await database_1.prisma.user.create({
            data: {
                full_name: 'Super Admin',
                email,
                password_hash,
                role: 'super_admin',
            },
        });
        console.log(`✅ Super Admin yaratildi: ${admin.email}`);
        console.log(`🔑 Parol: Admin@123456`);
    }
    else {
        console.log('ℹ️ Super Admin allaqachon mavjud:', email);
    }
    // Test sertifikat (ixtiyoriy)
    const testSerial = 'ITLA-00000001'; // 8-xonali
    const existing_cert = await database_1.prisma.certificate.findUnique({ where: { serial_number: testSerial } });
    if (!existing_cert) {
        const admin = await database_1.prisma.user.findUnique({ where: { email } });
        if (admin) {
            await database_1.prisma.certificate.create({
                data: {
                    serial_series: 'ITLA',
                    serial_number: testSerial,
                    full_name: 'Alisher Abdullayev',
                    course_name: 'Frontend Development',
                    course_description: 'HTML, CSS, JavaScript, React asoslarini o\'rganish kursi',
                    course_start_date: new Date('2024-01-15'),
                    course_end_date: new Date('2024-06-15'),
                    status: 'active',
                    is_generated: true,
                    created_by_id: admin.id,
                },
            });
            console.log(`✅ Test sertifikat yaratildi: ${testSerial}`);
        }
    }
    console.log('✅ Seed yakunlandi!');
    await database_1.prisma.$disconnect();
}
seed().catch((e) => {
    console.error('❌ Seed xatosi:', e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map