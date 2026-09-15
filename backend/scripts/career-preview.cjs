require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Preview requires local PostgreSQL.");
url.pathname = "/itlive_career_dev";
process.env.DATABASE_URL = url.toString();
process.env.FRONTEND_URL = "http://localhost:3017";
process.env.CAREER_URL = "http://localhost:3017";
process.env.PORT = "4017";
process.env.CAREER_DEMO = "true";
process.env.NODE_ENV = "development";
const db = new PrismaClient();
async function start() {
  const careerHash = await bcrypt.hash("CareerDemo2026!", 12);
  const adminHash = await bcrypt.hash("AdminDemo2026!", 12);
  const operator = await db.user.upsert({
    where: { email: "preview-operator@career.test" },
    update: { password_hash: adminHash },
    create: {
      email: "preview-operator@career.test",
      full_name: "Career Preview Operator",
      password_hash: adminHash,
      role: "super_admin",
    },
  });
  const people = [
    [
      "Azizbek Karimov",
      "Frontend dasturchi",
      "React,TypeScript,Tailwind CSS",
      "Toshkent",
      "Junior",
      "Remote",
      "Foydalanuvchi uchun qulay va tezkor veb-ilovalar yarataman. Toza kod va kichik detallarga alohida e’tibor beraman.",
    ],
    [
      "Madina Rasulova",
      "UI/UX dizayner",
      "Figma,Prototyping,Design Systems",
      "Samarqand",
      "Junior",
      "Hybrid",
      "Murakkab g‘oyalarni sodda interfeyslarga aylantiraman. Tadqiqotdan interaktiv prototipgacha bo‘lgan jarayonni yaxshi ko‘raman.",
    ],
    [
      "Javohir Usmonov",
      "Backend dasturchi",
      "C#,ASP.NET Core,PostgreSQL",
      "Toshkent",
      "Junior",
      "Office",
      "Ishonchli API va ma’lumotlar bazalarini loyihalayman. Jamoada ishlash va yangi muammolarga yechim topishga tayyorman.",
    ],
    [
      "Shahnoza Aliyeva",
      "Python dasturchi",
      "Python,Django,Git",
      "Buxoro",
      "Intern",
      "Remote",
      "Avtomatlashtirish va backend yo‘nalishida ishlayman. Amaliy loyihalarim orqali yangi bilimlarimni sinab boraman.",
    ],
    [
      "Bekzod Rahimov",
      "Mobil dasturchi",
      "Flutter,Dart,Firebase",
      "Farg‘ona",
      "Junior",
      "Hybrid",
      "Android va iOS uchun tushunarli, tez ishlaydigan ilovalar yarataman. Yangi mahsulot jamoasiga qo‘shilishni istayman.",
    ],
    [
      "Diyor Sobirov",
      "Full-stack dasturchi",
      "React,Node.js,PostgreSQL",
      "Toshkent",
      "Middle",
      "Remote",
      "G‘oyadan ishga tayyor mahsulotgacha. Frontend va backend orasida sifatli, puxta yechimlar yaratishni yoqtiraman.",
    ],
  ];
  for (let i = 0; i < people.length; i++) {
    const [name, headline, tech, city, level, format, bio] = people[i];
    const serial = `CAREER-DEMO-${String(i + 1).padStart(3, "0")}`;
    const cert = await db.certificate.upsert({
      where: { serial_number: serial },
      update: {},
      create: {
        serial_series: "DEMO",
        serial_number: serial,
        full_name: name,
        course_name: headline,
        course_start_date: new Date("2026-01-10"),
        course_end_date: new Date("2026-08-20"),
        created_by_id: operator.id,
      },
    });
    await db.careerAccount.upsert({
      where: { email: `preview-${i}@career.test` },
      update: { password_hash: careerHash },
      create: {
        email: `preview-${i}@career.test`,
        password_hash: careerHash,
        full_name: name,
        phone: "+998900000000",
        telegram: "career_demo",
        role: "graduate",
        status: "active",
        consent_at: new Date(),
        profile: {
          create: {
            certificate_id: cert.id,
            headline,
            bio,
            technologies: tech.split(","),
            city,
            level,
            work_format: format,
            skills: ["Jamoada ishlash", "Muammo yechish"],
            languages: ["O‘zbek — ona tili", "Ingliz — B2"],
            projects: [
              {
                name: "O‘quv loyihasi",
                description: "Ko‘rgazmali profil uchun namuna loyiha.",
                url: "",
              },
            ],
            published: true,
            contact_consent: true,
          },
        },
      },
    });
  }
  await db.careerAccount.upsert({
    where: { email: "employer@career.test" },
    update: { password_hash: careerHash, status: "active" },
    create: {
      email: "employer@career.test",
      password_hash: careerHash,
      full_name: "Dilshod Karimov",
      phone: "+998901112233",
      telegram: "career_employer",
      role: "employer",
      status: "active",
      company_name: "Career Demo Company",
      industry: "Software",
      website: "https://itlive.uz",
      consent_at: new Date(),
    },
  });
  await db.$disconnect();
  const app = require("../dist/app").default;
  app.listen(4017, "127.0.0.1", () =>
    console.log(
      "Career preview API: http://127.0.0.1:4017 (isolated demo database)",
    ),
  );
}
start().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
