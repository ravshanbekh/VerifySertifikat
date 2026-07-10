import { prisma } from './config/database';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seed boshlanmoqda...');

  // Super admin yaratish
  const email = 'admin@itlive.uz';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const password_hash = await bcrypt.hash('Admin@123456', 12);
    const admin = await prisma.user.create({
      data: {
        full_name: 'Super Admin',
        email,
        password_hash,
        role: 'super_admin',
      },
    });
    console.log(`✅ Super Admin yaratildi: ${admin.email}`);
    console.log(`🔑 Parol: Admin@123456`);
  } else {
    console.log('ℹ️ Super Admin allaqachon mavjud:', email);
  }

  // Test sertifikat (ixtiyoriy)
  const testSerial = 'ITLA-00000001'; // 8-xonali
  const existing_cert = await prisma.certificate.findUnique({ where: { serial_number: testSerial } });
  if (!existing_cert) {
    const admin = await prisma.user.findUnique({ where: { email } });
    if (admin) {
      await prisma.certificate.create({
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
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Seed xatosi:', e);
  process.exit(1);
});
