# TEXNIK TOPSHIRIQ (TZ)
## "ITLive Academy" Sertifikatlarni Tekshirish Platformasi
### verify.itliveacademy.uz

**Sana:** 2026-yil 8-iyul
**Versiya:** 1.0

---

## 1. LOYIHA HAQIDA UMUMIY MA'LUMOT

### 1.1. Maqsad
`itliveacademy.uz` domenining `verify.itliveacademy.uz` subdomeni ostida ishlaydigan, ITLive Academy o'quv markazi bergan sertifikatlarning haqiqiyligini seriya raqami yoki QR kod orqali tekshirish imkonini beruvchi veb-platforma yaratish.

### 1.2. Asosiy vazifalar
1. Sertifikatlarni tizim ichida generatsiya qilish (shablon asosida avtomatik PDF) **yoki** tayyor faylni yuklab saqlash — ikkalasi ham qo'llab-quvvatlanadi.
2. Har bir sertifikatga noyob seriya raqami va QR kod biriktirish.
3. Ochiq (public) sahifada istalgan kishi seriya raqami orqali sertifikat haqiqiyligini tekshira olishi.
4. QR kodni skanerlash orqali to'g'ridan-to'g'ri tekshiruv natijasiga o'tish.
5. Sertifikat yo'qolgan/buzilgan holatda uni tezda qayta chiqarish (reissue) imkoniyati.
6. Xodimlar uchun turli ruxsat darajalariga ega admin panel.
7. Butun tizimni Contabo serverida Docker konteynerlarda joylashtirish.

### 1.3. Tillar
Platforma va sertifikat shablonlari **3 tilda** bo'ladi: **O'zbek, Rus, Ingliz** (i18n — foydalanuvchi tanlagan yoki brauzer tiliga qarab avtomatik).

### 1.4. Dizayn/Brend
Mijozda tayyor logo, rang palitrasi va sertifikat shabloni mavjud — bular loyiha boshida taqdim etiladi (bo'lim 8.1 ga qarang).

---

## 2. FOYDALANUVCHI ROLLARI

| Rol | Huquqlar |
|---|---|
| **Mehmon (Public)** | Faqat seriya raqami/QR orqali qidirish va natijani ko'rish. Ro'yxatdan o'tish shart emas. |
| **Operator (Xodim)** | Yangi sertifikat qo'shish/generatsiya qilish, mavjudlarini ko'rish, tahrirlash. **O'chira olmaydi.** |
| **Super-Admin** | Operatorlarning barcha huquqlari + sertifikatni bekor qilish (revoke)/o'chirish, xodimlarni boshqarish (qo'shish/o'chirish/rol berish), tizim sozlamalari, audit log ko'rish. |

> Kelajakda rollar soni kengaytirilishi mumkin (masalan, "faqat ko'rish" huquqiga ega hisobotchi).

---

## 3. FUNKSIONAL TALABLAR

### 3.1. Public (ochiq) qism — verify.itliveacademy.uz

- **Bosh sahifa**: qidiruv maydoni (seriya raqami kiritish) + qisqacha "Bu nima?" tushuntirish.
- **Qidiruv natijasi** sahifasida ko'rsatiladi:
  - ✅/❌ status (Haqiqiy / Topilmadi / Bekor qilingan)
  - F.I.Sh (talaba)
  - Seriya va raqam
  - Kurs nomi
  - Kurs tavsifi
  - Kurs boshlangan sana
  - Kurs tugagan sana
  - Sertifikat skan/PDF ko'rinishi (agar mavjud)
- **QR orqali kirish**: `verify.itliveacademy.uz/c/{seriya-raqami}` manziliga o'tganda darhol natija ko'rsatiladi (qidiruv maydonini qo'lda to'ldirish shart emas).
- **Rate limiting**: bot/spam qidiruvlarning oldini olish uchun IP bo'yicha cheklov (masalan, 1 daqiqada 20 ta so'rov).
- **Til almashtirish tugmasi** (UZ/RU/EN).

### 3.2. Admin panel — verify.itliveacademy.uz/admin (yoki alohida `/dashboard`)

- **Kirish (Login)**: email/login + parol, JWT-based sessiya, parolni unutish funksiyasi.
- **Sertifikatlar ro'yxati**: qidiruv, filtr (sana, kurs, status), sahifalash (pagination).
- **Yangi sertifikat qo'shish** — 2 usul:
  1. **Avtomatik generatsiya**: forma quyidagi maydonlar bilan to'ldiriladi → tizim shablon asosida PDF yaratadi, seriya va raqamni avtomatik generatsiya qiladi, QR kodni PDF ichiga joylashtiradi:
     - F.I.Sh
     - Seriya va raqam (avtomatik generatsiya qilinadi, lekin operator qo'lda ham kiritishi/o'zgartirishi mumkin)
     - Kurs nomi
     - Kurs tavsifi
     - Kurs boshlangan sana
     - Kurs tugagan sana
  2. **Fayl yuklash**: tayyor PDF/rasm yuklanadi, tizim yuqoridagi bir xil maydonlarni (metama'lumot sifatida) bazaga yozadi va QR kod generatsiya qilib, kerak bo'lsa faylga qo'shib beradi (overlay) yoki alohida saqlaydi.
- **Sertifikatni tahrirlash**: ma'lumotlarni yangilash.
- **Qayta chiqarish (Reissue)**: yo'qolgan sertifikat uchun bir xil seriya raqami bilan yangi nusxa PDF generatsiya qilish.
- **Bekor qilish (Revoke)** — faqat Super-Admin: sertifikatni "bekor qilingan" deb belgilash (o'chirmasdan, tarix saqlanadi).
- **Xodimlarni boshqarish** — faqat Super-Admin: operator qo'shish/o'chirish, parolni reset qilish.
- **Audit log**: kim, qachon, qaysi sertifikatni yaratgani/o'zgartirgani/bekor qilgani haqida yozuv (kim nima qildi — ishonchlilik va nazorat uchun).

### 3.3. Seriya va raqam formati
Har bir sertifikat **Seriya** (harf/kod qismi, masalan: `ITLA` yoki `A`) va **Raqam** (tartib raqami, masalan: `000123`) dan iborat bo'ladi. To'liq ko'rinishi: `ITLA-000123` yoki `A-2026-000123` kabi — aniq format mijoz bilan kelishilgan holda belgilanadi. Raqam qismi avtomatik ketma-ket generatsiya qilinadi, operator xohlasa qo'lda ham tahrirlashi mumkin (masalan, eski/qog'oz sertifikatlarni tizimga kiritishda).

### 3.4. QR kod
- Har bir sertifikat yaratilganda avtomatik QR kod generatsiya qilinadi.
- QR ichida manzil: `https://verify.itliveacademy.uz/c/{seriya-raqami}`
- QR kod PDF sertifikat shablonining belgilangan joyiga (masalan, pastki o'ng burchak) joylashtiriladi.

---

## 4. NOFUNKSIONAL TALABLAR

- **Xavfsizlik**:
  - Barcha trafik HTTPS orqali (Let's Encrypt SSL sertifikati).
  - Admin panel uchun JWT + refresh token, parollar bcrypt/argon2 bilan hash qilinadi.
  - SQL Injection/XSS himoyasi (ORM ishlatilgani sababli avtomatik himoyalangan).
  - Public qidiruv endpointida rate-limiting.
  - (tavsiya) Super-Admin uchun 2FA (ixtiyoriy, keyingi bosqichda).
- **Ishonchlilik**: ma'lumotlar bazasi kunlik avtomatik backup (cron + `pg_dump`).
- **Tezkorlik**: qidiruv natijasi 1 soniyadan kam vaqtda qaytishi kerak.
- **Moslashuvchanlik (Responsive)**: mobil, planshet, desktop’da to'g'ri ko'rinish (chunki QR ko'pincha telefon orqali skanerlanadi).
- **Kengaytiriluvchanlik**: kelajakda boshqa sertifikat turlari (masalan, ishtirokchi sertifikati, mukofot) qo'shilishi mumkin bo'lgan tuzilma.

---

## 5. TEXNIK STEK (Tech Stack)

| Qatlam | Texnologiya |
|---|---|
| Frontend | Next.js (React), TailwindCSS |
| Backend | Node.js + Express (yoki NestJS) |
| Ma'lumotlar bazasi | PostgreSQL |
| ORM | Prisma |
| PDF generatsiya | Puppeteer (HTML→PDF) yoki pdf-lib |
| QR kod | `qrcode` npm kutubxonasi |
| Fayl saqlash | Server disk (Docker volume); kelajakda S3-mos saqlash mumkin |
| Autentifikatsiya | JWT (access + refresh token) |
| Konteynerizatsiya | Docker + Docker Compose |
| Reverse proxy / SSL | Nginx + Certbot (Let's Encrypt) |
| Server | Contabo VPS |

---

## 6. MA'LUMOTLAR BAZASI SXEMASI (asosiy jadvallar)

**certificates**
| Maydon | Tur | Izoh |
|---|---|---|
| id | UUID | |
| serial_series | string | Seriya (masalan: ITLA yoki A) |
| serial_number | string, unique | Raqam (masalan: 000123) — `serial_series` bilan birga to'liq noyob kod hosil qiladi |
| full_name | string | Talaba F.I.Sh |
| course_name | string | Kurs nomi |
| course_description | text | Kurs tavsifi |
| course_start_date | date | Kurs boshlangan sana |
| course_end_date | date | Kurs tugagan sana |
| status | enum (active/revoked) | |
| file_url | string | PDF/rasm manzili |
| qr_code_url | string | |
| created_by | FK → users.id | |
| created_at / updated_at | timestamp | |

**users** (xodimlar)
| Maydon | Tur |
|---|---|
| id | UUID |
| full_name | string |
| email | string, unique |
| password_hash | string |
| role | enum (operator / super_admin) |
| created_at | timestamp |

**audit_logs**
| Maydon | Tur |
|---|---|
| id | UUID |
| user_id | FK |
| action | string (created/updated/revoked/reissued) |
| certificate_id | FK, nullable |
| created_at | timestamp |

---

## 7. API ENDPOINTLARI (asosiy ro'yxat)

```
# Public
GET   /api/verify/:serialNumber        - sertifikatni tekshirish

# Auth
POST  /api/auth/login
POST  /api/auth/refresh
POST  /api/auth/logout

# Sertifikatlar (auth talab qilinadi)
GET   /api/certificates                - ro'yxat (filtr, pagination)
POST  /api/certificates                - yangi qo'shish (generatsiya)
POST  /api/certificates/upload         - tayyor faylni yuklash
GET   /api/certificates/:id            - bitta sertifikat
PUT   /api/certificates/:id            - tahrirlash
POST  /api/certificates/:id/reissue    - qayta chiqarish
POST  /api/certificates/:id/revoke     - bekor qilish (faqat super_admin)

# Xodimlar (faqat super_admin)
GET   /api/users
POST  /api/users
DELETE /api/users/:id
PUT   /api/users/:id/role

# Audit
GET   /api/audit-logs                  - (faqat super_admin)
```

---

## 8. LOYIHA UCHUN MIJOZDAN KERAK BO'LADIGAN MATERIALLAR

### 8.1. Dizayn/Brend materiallari
- [ ] Logotip (vektor formatda — SVG yoki yuqori sifatli PNG)
- [ ] Brend ranglari (HEX kodlar)
- [ ] Sertifikat shablon dizayni (agar tayyor bo'lsa — rasm yoki PDF namuna, yo'q bo'lsa layout tavsifi)
- [ ] Shrift (font) afzalliklari (agar bo'lsa)

### 8.2. Kontent
- [ ] Sertifikatda ko'rsatiladigan maydonlar tasdiqlangan: F.I.Sh, Seriya va raqam, Kurs nomi, Kurs tavsifi, Kurs boshlangan sana, Kurs tugagan sana (+ agar kerak bo'lsa, direktor imzosi/muhr rasmi)
- [ ] 3 tilda matnlar (sayt interfeysi uchun) — yoki tarjima uchun ruxsat
- [ ] Boshlang'ich xodimlar ro'yxati (F.I.Sh, email, rol: operator/super-admin)

### 8.3. Server/Domen
- [ ] Contabo serverga SSH kirish huquqi (root yoki sudo user)
- [ ] `itliveacademy.uz` domenining DNS boshqaruv paneliga kirish (A-record qo'shish uchun: `verify` → server IP)
- [ ] Serverda Docker/Docker Compose o'rnatilganligini tekshirish (agar yo'q bo'lsa, o'rnatib beramiz)

> **Eslatma:** Nginx/SSL serverda hozircha sozlanmagani noaniq bo'lgani sababli, deployment bosqichida buni tekshirib, kerak bo'lsa noldan sozlab beramiz (bo'lim 9 ga qarang).

---

## 9. DEPLOYMENT (Joylashtirish) REJASI

### 9.1. Docker tuzilishi
```
docker-compose.yml
├── frontend   (Next.js, port 3000 - ichki)
├── backend    (Node.js/Express, port 4000 - ichki)
├── postgres   (PostgreSQL, volume bilan)
└── nginx      (reverse proxy, 80/443, Certbot bilan SSL)
```

### 9.2. Qadamlar
1. Contabo serverni tekshirish, Docker/Docker Compose o'rnatish (agar yo'q bo'lsa).
2. DNS’da `verify.itliveacademy.uz` uchun A-record serverning IP-siga yo'naltiriladi.
3. Loyiha kodi serverga clone qilinadi / CI orqali yetkaziladi.
4. `.env` fayllar sozlanadi (DB parol, JWT secret va h.k.).
5. `docker compose up -d --build` orqali barcha konteynerlar ishga tushiriladi.
6. Nginx orqali domen ulanadi, Certbot yordamida SSL sertifikat olinadi va avtomatik yangilanishga sozlanadi.
7. Boshlang'ich Super-Admin foydalanuvchi yaratiladi (seed).
8. Test: qidiruv, sertifikat qo'shish, QR skanerlash bo'yicha to'liq tekshiruv.

### 9.3. Backup
- PostgreSQL ma'lumotlar bazasi uchun kunlik avtomatik backup (cron script + `pg_dump`), fayllar alohida joyga (masalan boshqa disk yoki bulut) saqlanadi.

---

## 10. ISHLAB CHIQISH BOSQICHLARI (taxminiy)

| Bosqich | Tavsif | Taxminiy muddat |
|---|---|---|
| 1 | Loyihalash: DB sxema, API dizayn, UI/UX maket | 3-4 kun |
| 2 | Backend: auth, CRUD, PDF/QR generatsiya | 5-7 kun |
| 3 | Frontend: public qidiruv sahifasi + admin panel | 5-7 kun |
| 4 | Integratsiya va testlash | 2-3 kun |
| 5 | Docker konfiguratsiya va serverga joylashtirish | 1-2 kun |
| 6 | Sinov muddati, tuzatishlar, o'qitish (mijozga admin panelni ko'rsatish) | 2-3 kun |

**Umumiy taxminiy muddat: ~3-4 hafta** (materiallar o'z vaqtida taqdim etilgan taqdirda).

---

## 11. KELAJAKDA KENGAYTIRISH IMKONIYATLARI (loyiha doirasidan tashqarida, lekin arxitektura hisobga oladi)

- Excel orqali ommaviy (bulk) import (hozircha talab qilinmagan, lekin arxitektura bунга tayyor bo'ladi).
- SMS/Email orqali sertifikat egasiga avtomatik xabar yuborish.
- Statistika/analitika paneli (necha sertifikat berilgan, oylik hisobot).
- Boshqa sertifikat turlari (ishtirokchi, mukofot) uchun alohida shablonlar.

---

## 12. TASDIQLASH

Ushbu texnik topshiriq loyihaning boshlang'ich ko'lamini belgilaydi. Ishlab chiqish jarayonida kichik o'zgarishlar kelishilgan holda kiritilishi mumkin. Katta funksional o'zgarishlar alohida muhokama qilinadi.

