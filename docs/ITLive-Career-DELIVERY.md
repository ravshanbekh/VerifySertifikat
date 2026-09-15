# ITLive Career — yetkazib berish va ishga tushirish

2026-09-09 · Holat: birinchi ishlaydigan lokal versiya. Internetga joylanmagan.

## Natija

Career `E:\verify.sertifikat` ichiga, mavjud Next.js + Express + Prisma arxitekturasida qo‘shildi. Productionda Verify bilan bitta PostgreSQL ishlaydi; sertifikat nusxalanmaydi. Career akkauntlari operator akkauntlaridan ajratilgan.

Lokal ko‘rgazma: **http://localhost:3017/career**. Katalogdagi oltita profil sun’iy sinov ma’lumoti; sahifada tegishli ogohlantirish bor. Ular haqiqiy bitiruvchilar emas. Bu manzil faqat ushbu kompyuterda ishlaydi, telefonda tarmoq orqali ochish hali sozlanmagan.

Talablar va dizayn qarorlari: [yangilangan TZ](./ITLive-Career-TZ.md).

## Ishlaydigan imkoniyatlar

- Bosh sahifa, jonli katalog, qidiruv, filtrlar, saralash va sahifalash.
- Sertifikat + administratorning shaxsiy kodi orqali bitiruvchi ro‘yxatdan o‘tishi; kodsiz yoki yaroqsiz sertifikat bilan akkaunt ochilmaydi.
- Bitiruvchi kabineti: profil, texnologiyalar, ko‘nikmalar, tillar, loyihalar, tajriba, LinkedIn/GitHub/portfolio, rasm va PDF CV, qoralama/e’lon/yashirish.
- Telefon, email va Telegram ro‘yxatdan o‘tishda olinadi. Ushbu versiyada ularni keyin mustaqil tahrirlash yo‘q.
- Ish beruvchi ro‘yxatdan o‘tishi, moderator tasdig‘i, saqlangan nomzodlar, ruxsat bilan kontakt va CV ochish.
- Verify super admin uchun `/admin/career`: shaxsiy kod berish, HR tasdiqlash va akkauntni bloklash.
- Sertifikat bekor qilinsa profil katalog, detail, kontakt va saqlanganlar ro‘yxatidan yashiriladi.
- Iliq och fon/o‘rmon-yashil va tungi rang tizimi, yirikroq matnlar, sodda ro‘yxat, moslashuvchan navbar, mobil menyu va bitta filtr oynasi.

## Tekshiruv dalillari

| Tekshiruv | Natija |
| --- | --- |
| Backend `npm run test:career` | **24/24** HTTP + haqiqiy PostgreSQL regressiya tekshiruvi o‘tdi |
| Backend `npm run build` | TypeScript muvaffaqiyatli yig‘ildi |
| Frontend `npm run build` | Next.js production yig‘ilishi muvaffaqiyatli |
| Career fayllariga ESLint | Xato va ogohlantirishsiz o‘tdi; butun eski repo auditi emas |
| Frontend `npm run test:career-routing` | Career root/katalog, Verify root saqlanishi, lokal prefiks, soxta routing header va Career hostida admin yo‘qligi o‘tdi |
| Brauzer desktop | Light/dark bosh sahifa va katalog vizual ko‘rildi |
| Brauzer 768 px | Planshetda ikki ustunli kartalar va yig‘iladigan navigatsiya ko‘rildi |
| Brauzer 390/360 px | Bir ustunli katalog/forma; tekshirilgan sahifalarda gorizontal overflow yo‘q |
| Mobil filtr | Junior tanlangach URL va natijalar o‘zgardi |
| Mobil menyu | Escape yopadi, fokus menyuni ochish tugmasiga qaytadi |
| Ro‘yxatdan o‘tish | Noto‘g‘ri sertifikat/kod xabari brauzerda tekshirildi |

Avtomatik tekshiruvlar: sertifikatsiz/kodsiz ro‘yxatdan o‘tish, parallel bitta sertifikatni band qilish, grant replay, canonical F.I.Sh., host-only HttpOnly sessiya, qoralama, admin huquqlaridan izolyatsiya, begona Origin, to‘liq bo‘lmagan profilni e’lon qilmaslik, xavfli URL, katalog maxfiyligi, katta-kichik harfsiz texnologiya/skill qidiruvi, guest/pending/approved HR, fayl turi aldovlari, private CV, audit, idempotent saqlash, sertifikat o‘chirilishini to‘xtatish, revoke, bloklash va logout.

Sinovlar lokal PostgreSQL 18 muhitida bajarildi. Docker production PostgreSQL 16 konfiguratsiyasi alohida stagingda tekshirilishi kerak. Docker/Nginx/TLS deployment sinovi yoki to‘liq WCAG sertifikatsiyasi bajarilgani da’vo qilinmaydi.

Oxirgi to‘liq test bazasi: `itlive_career_test_1788935202799`. Skript har safar alohida `itlive_career_test_<timestamp>` bazasi yaratadi va tekshiruvdan keyin saqlab qoladi. Sinov CV fayllari `backend/private-career` ichida qoladi. Avtomatik o‘chirish yo‘q.

## Lokal qayta ishga tushirish

Old shart: mavjud Node/npm bog‘liqliklari va lokal PostgreSQL ishlashi; `backend/.env` dagi lokal ulanish foydalanuvchisida yangi test bazasi yaratish huquqi bo‘lishi.

Birinchi terminal:

```powershell
Set-Location E:\verify.sertifikat\backend
npm run db:generate
npm run career:setup
npm run career:preview
```

Bu skriptlar haqiqiy Verify bazasi o‘rniga **`itlive_career_dev`** bazasini tanlaydi. Asl `.env` o‘zgartirilmaydi. `career:setup` yangi migratsiyalarni faqat shu sinov bazasiga qo‘llaydi. `career:preview` demo profillarni qo‘shadi va API’ni `127.0.0.1:4017` da ochadi. Lokal demo hisoblari: bitiruvchi `preview-0@career.test` / `CareerDemo2026!`, tasdiqlangan ish beruvchi `employer@career.test` / `CareerDemo2026!`, Verify super admin `preview-operator@career.test` / `AdminDemo2026!`. Bu hisoblar productionga ko‘chirilmaydi.

Ikkinchi terminal:

```powershell
Set-Location E:\verify.sertifikat\frontend
$env:CAREER_BACKEND_URL = 'http://127.0.0.1:4017'
npm run dev -- --port 3017 --hostname 127.0.0.1
```

Brauzerda aynan `http://localhost:3017/career` ni oching: ro‘yxatdan o‘tish uchun ruxsatli Origin shu manzil. `127.0.0.1:3017` orqali forma yuborish Origin tekshiruvida to‘xtatiladi.

Mavjud ishga tushgan 3017/4017 serverlari bo‘lsa ikkinchi nusxa ochmang. Terminaldagi Ctrl+C faqat shu preview serverini to‘xtatadi.

Backend tekshiruvi:

```powershell
Set-Location E:\verify.sertifikat\backend
npm run test:career
```

Host yo‘naltirish tekshiruvi (frontend preview ishlab turishi kerak):

```powershell
Set-Location E:\verify.sertifikat\frontend
npm run test:career-routing
```

## Domen va production oldi ishlari

1. Verify bazasi va fayllari backupini olish; nusxasida additive migratsiyani tekshirish. `career:setup` production migratsiya vositasi emas.
2. Stagingda `prisma migrate deploy` bilan `20260909120000_career_module` ni qo‘llash, Prisma client va backend/frontendni yig‘ish. Mavjud sertifikat/admin oqimlarini ham tekshirish.
3. Yagona backend uchun `FRONTEND_URL=https://verify.itlive.uz`, `CAREER_URL=https://career.itlive.uz`, production sirlarini sozlash. Career brauzer so‘rovlari same-origin `/api/career/v1` ishlatadi.
4. `career.itlive.uz` DNS va HTTPS sertifikatini sozlash. `nginx/career.conf` tashqi TLS proksidan keladigan Career hostini bir xil frontend/backendga yo‘naltiradi; bu faylning o‘zi HTTPS sertifikatini yaratmaydi.
5. Private CV volume, backup, fayllarni saqlash/o‘chirish siyosati va zararli fayllarni tekshirishni belgilash. Hozir almashtirilgan eski fayllar avtomatik tozalanmaydi.
6. Super admin bitiruvchining shaxsini tekshirish, kodni shaxsiy kanal bilan yetkazish va HR kompaniyasini tasdiqlash tartibini joriy qilish.
7. Email/telefon tasdig‘i, parol tiklash, maxfiylik/foydalanish matnlarini yakunlash, akkaunt/ma’lumotni tuzatish va o‘chirish so‘rovlari tartibini ochiq ishga tushirishdan oldin tayyorlash.
8. Productionda Secure cookie, Origin, revoke, fayl ruxsati, proksi IP/rate limitlari, monitoring, zaxira nusxa va tiklashni tekshirish. Hozir rate limitlar bitta process xotirasida; bir nechta backend nusxasi uchun umumiy store kerak.

Rollback: yangi hostni vaqtincha o‘chirish yoki oldingi ilova versiyasini qaytarish. Yangi Career jadvallarini avtomatik tushirish yoki bazani reset qilish yo‘q; ma’lumot saqlanadi.

## Chegaralar

Hozirgi topshirish — funksional birinchi katalog versiyasi, to‘liq production yakuni emas. Vakansiya/ariza/chat/AI moslik, ko‘p sertifikatni bir shaxsga birlashtirish, kompaniya/akkaunt muharriri, avtomatik OTP/parol tiklash, kengaytirilgan filtrlar, to‘liq admin shikoyat va tarix interfeysi keyingi bosqichga qoldirilgan. Backend history/report endpointlari bor, lekin ularga to‘liq admin kabineti hali yo‘q.

Asl Verify ma’lumotlari, mavjud admin parollari, DNS va ishlayotgan production servislar o‘zgartirilmadi. Git commit/push bajarilmadi.
