# ITLive Career — yangilangan texnik topshiriq

Versiya: 1.1 · 2026-09-09 · Mahsulot egasi: Ravshan (Promptokrat).

## 1. Qabul qilingan qaror

Career mavjud `E:\verify.sertifikat` repozitori ichida quriladi. Mavjud Next.js frontend, Express modullari, Prisma va PostgreSQL arxitekturasi davom ettiriladi. Verify va Career bitta bazadan foydalanadi. Production manzillari: `verify.itlive.uz` va `career.itlive.uz`.

Bu hujjat oldingi TZdagi “ikki alohida ilova, alohida autentifikatsiya serveri, Verify HTTP integratsiya tokeni va webhook” qarorini almashtiradi. Endi bitta backend ichidagi Career moduli mavjud `Certificate` jadvalini to‘g‘ridan-to‘g‘ri tekshiradi. Nusxa sertifikat bazasi, ichki HTTP so‘rov va 24 soatlik holat sinxronizatsiyasi kerak emas.

Verify operatorlari va Career foydalanuvchilari bitta PostgreSQL ichida **alohida jadvallar va alohida sessiyalar** bilan ishlaydi. Bitiruvchi yoki HR akkaunti sertifikat yaratish/o‘chirish huquqini olmaydi.

## 2. Maqsad va rollar

Faqat ITLive Academy sertifikatiga ega bitiruvchi professional profil yaratadi. Ish beruvchi texnologiya, yo‘nalish, tajriba darajasi, joylashuv va ish uslubi bo‘yicha mos nomzodni topadi.

| Rol | Huquq |
| --- | --- |
| Mehmon | E’lon qilingan professional profillarni ko‘rish; kontaktlar yashiriladi |
| Bitiruvchi | Sertifikat asosida akkaunt ochish, profil, texnologiya, tajriba, loyiha va aloqa ma’lumotlarini boshqarish |
| HR / ish beruvchi | Kompaniya akkaunti, moderator tasdig‘idan keyin kontaktlar, CV va saqlangan nomzodlar |
| Verify super admin | Faollashtirish kodi berish, HR tasdiqlash, akkauntni bloklash va audit |

## 3. Sertifikat egasini tekshirish

Repository tekshiruvida `Certificate` jadvalida telefon/email yo‘qligi aniqlandi. Ochiq sertifikat raqami egasini isbotlamaydi. Joriy yechim:

1. Super admin bitiruvchi shaxsini akademiyadagi yozuvlar bilan tekshiradi.
2. Verify admin panelidagi Career bo‘limidan sertifikatga bir martalik tasodifiy kod beradi.
3. Kod 7 kun amal qiladi; bazada faqat SHA-256 xeshi saqlanadi. Yangi kod berilsa avvalgisi yaroqsizlanadi.
4. Bitiruvchi sertifikat raqami va shaxsiy kodni kiritadi.
5. Backend sertifikatni, bekor qilinmaganligini, kod muddatini va bog‘langan akkaunt yo‘qligini tekshiradi.
6. Muvaffaqiyatli bo‘lsa 10 daqiqalik bir martalik grant qaytariladi. F.I.Sh. va kurs serverdagi sertifikatdan olinadi.
7. Akkaunt yaratilayotganda sertifikat yana tekshiriladi. Transaction, sertifikat qatorini bloklash va unique bog‘lanish parallel so‘rovlarda ham ikkinchi akkauntni to‘xtatadi.

Kod bitiruvchiga shaxsiy kanal orqali administrator tomonidan yetkaziladi. Ushbu versiya SMS yoki email yetkazib berishni avtomatlashtirmaydi. Keyinchalik tasdiqlangan kontaktlar qo‘shilgach OTP ulanishi mumkin.

## 4. Bitiruvchi profili

Sertifikatdan avtomatik: F.I.Sh., kurs, sertifikat raqami, bitirgan sana, haqiqiylik holati. Bu qiymatlar foydalanuvchi tomonidan o‘zgartirilmaydi.

Akkauntda: email, telefon, Telegram va parol. Telefon xalqaro formatda; Telegram username; email kichik harflarga normalizatsiya qilinadi.

Profilda: rasm, mutaxassislik, qisqacha tanishtirish, shahar, daraja (Intern/Junior/Middle/Senior), ish formati (Remote/Office/Hybrid), ish turi, ish qidirish holati, texnologiyalar, professional ko‘nikmalar, tillar, tajriba, 8 tagacha loyiha, GitHub, portfolio, LinkedIn va CV.

Texnologiya, ko‘nikma va tillar ro‘yxati har biri 20 tagacha. Matn va URL maydonlari serverda uzunlik va format bo‘yicha tekshiriladi. Tashqi havolalar faqat HTTPS; LinkedIn/GitHub o‘z domenlariga mos bo‘lishi kerak.

Rasm 5 MB gacha: server uni tekshirib, 512×512 WebP formatiga o‘giradi. CV 5 MB gacha PDF: ochiq uploads papkasida saqlanmaydi; faqat ruxsatli endpoint orqali yuklab olinadi.

Profil muharriri: Asosiy → Ko‘nikmalar → Loyihalar → Aloqa → E’lon qilish. Qoralama saqlash va katalogdan yashirish mavjud.

E’lon qilish uchun F.I.Sh./faol sertifikat, mutaxassislik, kamida 20 belgili bio, shahar, kamida 3 texnologiya, kamida 1 ko‘nikma va alohida kontakt roziligi talab qilinadi. Profil kamida 70% to‘ldiriladi. Olti asosiy mezon har biri 12 ball; rasm, loyiha, til, GitHub/LinkedIn mezonlari har biri 7 ball. Maksimal 100%.

Tasdiqlanganlik belgisi sertifikat haqiqiyligini bildiradi; barcha ko‘nikmalar mustaqil imtihonda tekshirilgan degani emas.

## 5. Ish beruvchi oqimi

Kompaniya nomi, mas’ul shaxs, email, telefon, Telegram, faoliyat sohasi va parol; sayt ixtiyoriy. Ro‘yxatdan o‘tgach `pending` holati. Super admin tashkilotni tekshirib `active` holatiga o‘tkazadi. Bloklangan akkaunt sessiyalari yaroqsizlanadi.

Tasdiqlangan HR profilni saqlaydi, telefon/email/Telegram/LinkedInni ochadi va mavjud CVni yuklaydi. Kontakt/CV ochish kuniga 50 ta bilan cheklanadi va auditga yoziladi. Saqlash takrorlansa dublikat yaratilmaydi. O‘chirilgan yoki bekor qilingan sertifikatli profil saqlanganlar ro‘yxatida ham ko‘rinmaydi.

## 6. Katalog va navigatsiya

Katalog: ism, mutaxassislik, kurs, texnologiya/ko‘nikma bo‘yicha qidiruv. Filtrlar: daraja, shahar, ish formati, ish turi, texnologiya, ish izlash holati. Saralash: yangi yangilangan yoki ism bo‘yicha. Sahifalash: 12 ta profil.

Kartada: ish holati, ism/rasm, tasdiqlanganlik belgisi, kasb, bio, texnologiyalar, shahar/daraja/format va “Profil”/“Saqlash” amallari. Guest API javobiga telefon, email, Telegram, LinkedIn yoki CV fayl yo‘li kiritilmaydi.

Navbar: ITLive Career belgisi, Mutaxassislar, Ish beruvchilar uchun, Qanday ishlaydi?, rang rejimi, Kirish/Profil yaratish yoki Kabinetim. Mobil menyu fokusni ushlab turadigan dialog, Escape bilan yopiladi.

Career sahifalari: `/`, `/candidates`, `/candidates/:id`, `/register`, `/login`, `/dashboard`, `/saved`, `/employers`, `/about`, `/privacy`, `/terms`. Lokal ko‘rish uchun ular `/career` prefiksi ostida. Career domenida host bo‘yicha Next.js Proxy ularni ichki `/career` moduliga yo‘naltiradi.

## 7. Dizayn tahlili va qaror

2026-09-09 kuni Wellfound va Welcome to the Jungle sahifalari brauzerda vizual ko‘rildi. TechJobs bo‘yicha avvalgi suhbatdagi 2026-08-12 kuzatuvlari ishlatildi; joriy TechJobs holati qayta tekshirilmagan.

| Manba | Kuzatilgan yechim | Career uchun qaror |
| --- | --- | --- |
| [Wellfound Hire](https://wellfound.com/hire) | Katta aniq sarlavha, oq bo‘shliq, to‘q asosiy CTA, nomzod namunalari | Ta’limdan karyeraga yo‘lni tushuntiruvchi hero; ish beruvchi va bitiruvchi uchun alohida amallar |
| [Welcome to the Jungle Jobs](https://www.welcometothejungle.com/en-GB/jobs) | Ixcham navigatsiya, “I’m a recruiter” alohida kirish, ko‘zga tashlanadigan qidiruv | Sodda rol navigatsiyasi, bir asosiy qidiruv, rangni tanlangan holat va amallarga berish |
| [TechJobs Candidates](https://techjobs.uz/candidates) | Daraja/shahar/formatga yaqin filtrlar, mutaxassis va HR rollari | Mahalliy foydalanuvchiga tanish katalog, texnologiya belgisi va profilga tez o‘tish |

Konsept: “Iste’doddan imkoniyatga” — ta’lim ishonchini professional karyera interfeysiga olib o‘tish.

Brend sifatlari: ishonchli, ochiq, amaliy. Qochiladigan sifatlar: shovqinli, haddan tashqari bezakli, noaniq.

Shrift: loyihadagi Geist saqlanadi. Sarlavha 34–53 px, matn 13–16 px, yordamchi ma’lumot kichikroq. Uzun matn qatorlari chegaralanadi.

Light: ko‘zni charchatmaydigan iliq `#f3f0e8` fon, `#fffefa` kartalar, to‘q siyoh matn va asosiy o‘rmon-yashil `#17543e`. Dark: yashil tusli `#161e1b` fon, `#222e27` kartalar, och matn va `#acd5b8` aksent. Sokin oltin va binafsha ranglar faqat avatar farqlash uchun ishlatiladi. Ranglar CSS tokenlari bilan boshqariladi.

Button: asosiy to‘liq yashil rang, ikkilamchi nozik chegara, ikonali amallarda tushunarli nom. Hover, focus, loading, disabled va xato holatlari bor. Umumiy radius 8–12 px, asosiy container 1120 px. Bir xil lucide ikonalar oilasi.

Imzo elementi: iliq qog‘ozsimon fon, sodda mutaxassislar ro‘yxati va sertifikat belgisi. Katalog birinchi qarashda faqat ism, kasb, daraja, joylashuv, ish formati, uchta texnologiya va holatni ko‘rsatadi; qolgan tafsilot profil ichida. Soxta statistika yo‘q: profil soni bazadan keladi. Preview ma’lumotlari ekranda “sinov rejimi” deb belgilanadi.

## 8. Moslashuvchanlik va qulaylik

| Ekran | Joylashuv |
| --- | --- |
| Desktop, 1280/1440 px | To‘liq navbar, ikki ustunli hero, yon filtrlar + ikki ustunli kartalar |
| Planshet, 768 px | Yig‘iladigan menyu, filtrlar dialogda, ikki ustunli kartalar |
| Telefon, 390/360 px | Bir ustun, ixcham navbar, alohida mobil filtr, katta CTA, formalar ketma-ket |

Semantik tugma/input/label ishlatiladi; ko‘rinadigan klaviatura fokusi; bo‘sh, yuklanish, xato va muvaffaqiyat holatlari; rasm uchun alt; rangdan tashqari yozuv va belgi; `prefers-reduced-motion`; kontaktlar ustunining telefonda yuqoriga chiqishi. Ekran tashqarisiga gorizontal siljish bo‘lmasligi tekshiriladi.

## 9. Texnik tuzilma

- `frontend/app/career` — alohida layout, metadata va faqat Career doirasidagi CSS.
- `frontend/components/career` — umumiy shell, katalog, auth, profil, kabinet va ma’lumot sahifalari.
- `frontend/app/admin/career` — Verify super admin kabinetidagi Career boshqaruvi.
- `backend/src/modules/career` — router, session/origin middleware, validatsiya va so‘rovlar.
- Prisma: `CareerAccount`, `CareerProfile`, `CareerInvite`, `CareerSession`, `CareerSaved`, `CareerEvent`.
- `Certificate` — yagona manba; profil uning IDsi bilan unique bog‘langan.
- `/api/career/v1` — versiyalangan API; response’da maxfiy maydonlar aniq ajratilgan.
- Sertifikat bekor qilinishi har katalog/profil/kontakt so‘rovida tekshiriladi. Career’ga bog‘langan sertifikatni o‘chirish o‘rniga revoke ishlatiladi.

## 10. Sessiya va himoya

Career sessiyasi tasodifiy 256-bit token bilan, bazada SHA-256 xesh orqali, HttpOnly/host-only cookie’da saqlanadi. Productionda Secure; SameSite=Lax; muddati 7 kun. Barcha o‘zgartiruvchi Career so‘rovlari ishonchli Origin ro‘yxatiga mos kelishi kerak. Bu `.itlive.uz` ostidagi boshqa domenlardan yuboriladigan so‘rovlarni ham cheklaydi. Login va grant tekshiruviga alohida rate limit.

Bitiruvchi fayl, rol, sertifikat yoki administrator maqomini frontend orqali o‘ziga tayinlay olmaydi. Bloklash va logout server sessiyasini bekor qiladi. Xato javobi ichki ma’lumotlar bazasi tafsilotlarini oshkor qilmaydi.

## 11. API yuzasi

| Endpoint | Maqsad |
| --- | --- |
| `POST /eligibility` | Sertifikat + shaxsiy kod → 10 daqiqalik grant |
| `POST /register`, `POST /login`, `POST /logout`, `GET /me` | Akkaunt va sessiya |
| `GET /catalog`, `GET /summary`, `GET /profiles/:id` | Ochiq katalog |
| `PUT /profile`, `POST /profile/avatar`, `POST /profile/cv` | Bitiruvchi profilini boshqarish |
| `POST /profiles/:id/contacts`, `GET /profiles/:id/cv` | HR uchun ruxsatli aloqa |
| `GET /saved`, `PUT/DELETE /saved/:id` | Saqlangan nomzodlar |
| `GET /history`, `POST /profiles/:id/report` | Aloqa tarixi va shikoyat |
| `GET /admin/accounts`, `POST /admin/invites`, `PATCH /admin/accounts/:id`, `GET /admin/events` | Verify super admin boshqaruvi |

## 12. Ishga tushirish va bazaga o‘zgarish

Additive migration: `20260909120000_career_module`. Production ma’lumotlari ko‘chirilmaydi yoki avtomatik seed qilinmaydi. Avval staging backup va migratsiya tekshiruvi; keyin `prisma migrate deploy`, backend/frontend build, yangi host sozlamalari. Career domenini DNS/TLS bilan alohida yo‘naltirish kerak.

`nginx/career.conf` yangi vhost; mavjud Verify vhost ishlaydi. `CAREER_URL=https://career.itlive.uz`; brauzer API so‘rovlari shu origin ostida `/api/career/v1`. Yagona PostgreSQL va bitta backend; CV fayllariga alohida private volume. DNS/TLS o‘zgarishlari ushbu lokal ish tarkibida bajarilmagan.

Lokal preview haqiqiy Verify bazasiga tegmaydi: `itlive_career_dev` alohida sinov bazasi. Bu faqat ishlab chiqish izolyatsiyasi; production arxitekturada bitta baza ishlatiladi.

## 13. Tekshiriladigan qabul mezonlari

1. Sertifikatsiz, kodsiz, noto‘g‘ri/eskirgan kod yoki ishlatilgan grant bilan bitiruvchi akkaunti ochilmaydi.
2. Bir paytdagi ikkita ro‘yxatdan o‘tishdan faqat bittasi sertifikatni band qiladi.
3. F.I.Sh. client yuborgan qiymatdan emas, sertifikatdan olinadi.
4. Career akkaunti Verify admin endpointlariga kira olmaydi.
5. E’lon uchun asosiy maydonlar, 70% va kontakt roziligi majburiy.
6. Ochiq API’da kontaktlar va CV yo‘li bo‘lmaydi; pending/guest ularga kira olmaydi.
7. Tasdiqlangan HR qidiradi, saqlaydi va auditga yozilgan holda bog‘lanadi.
8. Revoke holati katalog, profil, kontakt va saqlanganlar uchun darhol kuchga kiradi.
9. Host bo‘yicha career domenining root’i Career, verify root’i sertifikat tekshiruvini ko‘rsatadi.
10. 390/768/1280 px ekranlarda, light/dark rejimda formalar va navigatsiya ishlaydi.

## 14. Keyingi iteratsiyalar

Birlamchi ishga tushirishdan keyin: email/telefon OTP xizmatlari, avtomatik parol tiklash, kompaniya profili/logotipi muharriri, bir nechta sertifikatni bir bitiruvchi IDsi ostida birlashtirish, yo‘nalish/yil/tajriba/tillar bo‘yicha kengaytirilgan filtrlar, boshqariladigan skill ma’lumotnomasi, to‘liq statistika va admin shikoyat/tarix interfeysi.

Keyingi mahsulot bosqichi: vakansiyalar, ariza yuborish, intervyu jarayoni, Telegram xabarnomasi, AI moslik, ichki chat va pullik tariflar. Ushbu funksiyalar birinchi katalog versiyasiga kiritilmagan.

## 15. Yetkazib berish dalillari

Yig‘ilish, avtomatik sinovlar va responsive tekshiruv natijalari `docs/ITLive-Career-DELIVERY.md` faylida yuritiladi. U yerda bajarilgan funksiyalar, sinov muhiti va qolgan ishlab chiqarish oldi ishlari aniq ajratiladi.
