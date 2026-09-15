// End-to-end HTTP regression checks against a fresh, isolated local PostgreSQL DB.
require("dotenv").config({ quiet: true });
const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");
const { randomBytes } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const source = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(source.hostname))
  throw new Error("Tests only run on local PostgreSQL.");
const testName = `itlive_career_test_${Date.now()}`;
const target = new URL(source);
target.pathname = `/${testName}`;
process.env.DATABASE_URL = target.toString();
process.env.NODE_ENV = "test";
process.env.CAREER_URL = "http://localhost:3017";
process.env.FRONTEND_URL = "http://localhost:3017";
let server, db;
let passed = 0;
const check = (label) => {
  passed++;
  console.log(`PASS ${label}`);
};
async function main() {
  const a = new URL(source);
  a.pathname = "/postgres";
  const adminDb = new PrismaClient({
    datasources: { db: { url: a.toString() } },
  });
  await adminDb.$executeRawUnsafe(`CREATE DATABASE "${testName}"`);
  await adminDb.$disconnect();
  const migrated = spawnSync(
    process.execPath,
    [
      path.join("node_modules", "prisma", "build", "index.js"),
      "migrate",
      "deploy",
    ],
    { env: process.env, encoding: "utf8" },
  );
  if (migrated.status !== 0) throw new Error(migrated.stderr);
  db = new PrismaClient();
  const app = require("../dist/app").default;
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api/career/v1`;
  const request = async (
    url,
    {
      method = "GET",
      body,
      cookie,
      token,
      origin = "http://localhost:3017",
    } = {},
  ) => {
    const r = await fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: r.status,
      body: await r.json(),
      cookie: r.headers.get("set-cookie")?.split(";")[0],
      rawCookie: r.headers.get("set-cookie"),
    };
  };
  const staff = await db.user.create({
    data: {
      email: "admin@career.test",
      full_name: "Test Admin",
      role: "super_admin",
      password_hash: "not-a-real-hash",
    },
  });
  const token = jwt.sign({ id: staff.id }, process.env.JWT_SECRET || "secret");
  const cert = await db.certificate.create({
    data: {
      serial_series: "TEST",
      serial_number: "TEST-CAREER-001",
      full_name: "Test Graduate",
      course_name: "Frontend",
      course_start_date: new Date("2026-01-01"),
      course_end_date: new Date("2026-08-01"),
      created_by_id: staff.id,
    },
  });
  const fields = {
    email: "graduate@career.test",
    password: randomBytes(12).toString("hex"),
    phone: "+998901234567",
    telegram: "career_test",
    consent: true,
    role: "graduate",
  };
  assert.equal(
    (await request("/register", { method: "POST", body: fields })).status,
    400,
  );
  check("Cannot register without certificate proof");
  assert.equal(
    (
      await request("/admin/invites", {
        method: "POST",
        body: { serial_number: cert.serial_number },
      })
    ).status,
    401,
  );
  check("Anonymous users cannot issue enrollment codes");
  const inv = await request("/admin/invites", {
    method: "POST",
    token,
    body: { serial_number: cert.serial_number },
  });
  assert.equal(inv.status, 200);
  assert.equal(
    (
      await request("/eligibility", {
        method: "POST",
        body: { serial_number: cert.serial_number, code: "wrong-code-1234" },
      })
    ).status,
    400,
  );
  check("Certificate number alone is not ownership proof");
  let eligible = await request("/eligibility", {
    method: "POST",
    body: { serial_number: cert.serial_number, code: inv.body.data.code },
  });
  assert.equal(eligible.status, 200);
  const attempt = {
    ...fields,
    full_name: "Forged Name",
    grant: eligible.body.data.grant,
  };
  const concurrent = await Promise.all([
    request("/register", { method: "POST", body: attempt }),
    request("/register", {
      method: "POST",
      body: { ...attempt, email: "other@career.test" },
    }),
  ]);
  assert.equal(concurrent.filter((r) => r.status === 201).length, 1);
  const registered = concurrent.find((r) => r.status === 201);
  const graduateCookie = registered.cookie;
  assert.equal(registered.body.data.full_name, "Test Graduate");
  assert(!JSON.stringify(registered.body).includes("password_hash"));
  assert.match(registered.rawCookie, /HttpOnly/i);
  assert(!registered.rawCookie.includes("Domain="));
  check(
    "Atomic single claim, canonical identity and host-only HttpOnly session",
  );
  assert.equal(
    (await request("/register", { method: "POST", body: attempt })).status,
    400,
  );
  check("Used grant cannot be replayed");
  const me = await request("/me", { cookie: graduateCookie });
  assert.equal(me.status, 200);
  const id = me.body.data.profile.id;
  assert.equal(
    (
      await request("/profile", {
        method: "PUT",
        cookie: graduateCookie,
        body: { ...me.body.data.profile, published: false },
      })
    ).status,
    200,
  );
  check("Empty graduate profile can be saved as a private draft");
  assert.equal(
    (await request("/admin/accounts", { cookie: graduateCookie })).status,
    401,
  );
  check("Career sessions do not grant Verify admin access");
  assert.equal(
    (
      await request("/profile", {
        method: "PUT",
        cookie: graduateCookie,
        origin: "https://evil.itlive.uz",
        body: {},
      })
    ).status,
    403,
  );
  check("Sibling-domain CSRF blocked");
  const profile = {
    ...me.body.data.profile,
    headline: "Frontend developer",
    bio: "React va TypeScript bilan ilovalar yarataman.",
    city: "Toshkent",
    technologies: ["React", "TypeScript", "Git"],
    skills: ["Teamwork"],
    languages: ["Uzbek"],
    projects: [],
    contact_consent: true,
    published: true,
  };
  assert.equal(
    (
      await request("/profile", {
        method: "PUT",
        cookie: graduateCookie,
        body: { ...profile, technologies: [] },
      })
    ).status,
    400,
  );
  check("Incomplete profiles cannot publish");
  assert.equal(
    (
      await request("/profile", {
        method: "PUT",
        cookie: graduateCookie,
        body: { ...profile, linkedin: "javascript:alert(1)" },
      })
    ).status,
    400,
  );
  check("Unsafe profile links rejected");
  assert.equal(
    (
      await request("/profile", {
        method: "PUT",
        cookie: graduateCookie,
        body: profile,
      })
    ).status,
    200,
  );
  const catalog = await request(
    "/catalog?technology=React&city=Toshkent&level=Junior",
  );
  assert.equal(catalog.body.meta.total, 1);
  assert(!JSON.stringify(catalog.body).includes("career.test"));
  assert(!JSON.stringify(catalog.body).includes("phone"));
  check("Live catalog filters work and public responses exclude contacts");
  assert.equal((await request("/catalog?q=typescript")).body.meta.total, 1);
  assert.equal((await request("/catalog?q=teamwork")).body.meta.total, 1);
  assert.equal((await request("/catalog?q=nonexistent")).body.meta.total, 0);
  check("Case-insensitive technology and skill search, and empty results");
  assert.equal(
    (await request(`/profiles/${id}/contacts`, { method: "POST" })).status,
    401,
  );
  check("Guests cannot open contact details");
  const uploadFile = async (route, bytes, mime, cookie) => {
    const form = new FormData();
    form.set("file", new Blob([bytes], { type: mime }), "test-upload");
    return fetch(base + route, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3017",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: form,
    });
  };
  assert.equal(
    (
      await uploadFile(
        "/profile/cv",
        "not a PDF",
        "application/pdf",
        graduateCookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await uploadFile(
        "/profile/avatar",
        "not an image",
        "image/png",
        graduateCookie,
      )
    ).status,
    400,
  );
  check("Spoofed PDF and image upload MIME types are rejected");
  const pdf = await require("pdf-lib").PDFDocument.create();
  pdf.addPage();
  const pdfBytes = await pdf.save();
  assert.equal(
    (await uploadFile("/profile/cv", pdfBytes, "application/pdf")).status,
    401,
  );
  assert.equal(
    (
      await uploadFile(
        "/profile/cv",
        pdfBytes,
        "application/pdf",
        graduateCookie,
      )
    ).status,
    200,
  );
  const privateProfile = await db.careerProfile.findUnique({ where: { id } });
  assert.equal(
    (
      await fetch(
        base.replace("/api/career/v1", "") +
          "/uploads/" +
          privateProfile.cv_filename,
      )
    ).status,
    404,
  );
  assert.equal((await fetch(base + `/profiles/${id}/cv`)).status, 401);
  check("Graduate CV upload is authenticated and file is not publicly served");
  const employer = await request("/register", {
    method: "POST",
    body: {
      ...fields,
      email: "employer@career.test",
      role: "employer",
      full_name: "Test HR",
      company_name: "Test Company",
      industry: "Software",
    },
  });
  assert.equal(employer.status, 201);
  const ec = employer.cookie;
  assert.equal(
    (await request(`/profiles/${id}/contacts`, { method: "POST", cookie: ec }))
      .status,
    403,
  );
  check("Pending employers cannot access contacts");
  assert.equal(
    (await fetch(base + `/profiles/${id}/cv`, { headers: { Cookie: ec } }))
      .status,
    403,
  );
  assert.equal(
    (
      await request(`/admin/accounts/${employer.body.data.id}`, {
        method: "PATCH",
        token,
        body: { status: "active" },
      })
    ).status,
    200,
  );
  const contact = await request(`/profiles/${id}/contacts`, {
    method: "POST",
    cookie: ec,
  });
  assert.equal(contact.status, 200);
  assert.equal(contact.body.data.phone, fields.phone);
  assert.equal(
    await db.careerEvent.count({ where: { action: "contact_viewed" } }),
    1,
  );
  check("Approved employer contact views are audited");
  const cv = await fetch(base + `/profiles/${id}/cv`, {
    headers: { Cookie: ec },
  });
  assert.equal(cv.status, 200);
  assert.match(cv.headers.get("content-disposition"), /attachment/);
  assert.deepEqual(Buffer.from(await cv.arrayBuffer()), Buffer.from(pdfBytes));
  assert.equal(
    await db.careerEvent.count({ where: { action: "cv_downloaded" } }),
    1,
  );
  check(
    "Only approved employers download the exact CV through audited attachment response",
  );
  const adminSummary = await request("/admin/summary", { token });
  assert.equal(adminSummary.status, 200);
  assert.equal(adminSummary.body.data.graduates, 1);
  assert.equal(adminSummary.body.data.employers, 1);
  assert.equal(adminSummary.body.data.pending, 0);
  assert.equal(adminSummary.body.data.published, 1);
  const adminEvents = await request("/admin/events", { token });
  assert.equal(adminEvents.status, 200);
  assert.ok(
    adminEvents.body.data.some(
      (event) =>
        event.action === "contact_viewed" &&
        event.account?.email === "employer@career.test",
    ),
  );
  check("Combined admin summary and Career audit return live data");
  assert.equal(
    (await request(`/saved/${id}`, { method: "PUT", cookie: ec })).status,
    200,
  );
  assert.equal(
    (await request(`/saved/${id}`, { method: "PUT", cookie: ec })).status,
    200,
  );
  assert.equal((await request("/saved", { cookie: ec })).body.data.length, 1);
  check("Shortlisting is persistent and idempotent");
  const del = await fetch(
    base.replace("/api/career/v1", "") + `/api/certificates/${cert.id}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );
  assert.equal(del.status, 409);
  check("Career-linked certificate cannot be deleted");
  await db.certificate.update({
    where: { id: cert.id },
    data: { status: "revoked" },
  });
  assert.equal((await request("/catalog")).body.meta.total, 0);
  assert.equal((await request(`/profiles/${id}`)).status, 404);
  assert.equal(
    (await request(`/profiles/${id}/contacts`, { method: "POST", cookie: ec }))
      .status,
    404,
  );
  assert.equal((await request("/saved", { cookie: ec })).body.data.length, 0);
  check(
    "Revocation immediately hides catalog, detail, saved profiles and contacts",
  );
  const other = await db.certificate.create({
    data: {
      serial_series: "TEST",
      serial_number: "TEST-CAREER-002",
      full_name: "Second Graduate",
      course_name: "Backend",
      course_start_date: new Date("2026-01-01"),
      course_end_date: new Date("2026-08-01"),
      created_by_id: staff.id,
    },
  });
  const inv2 = await request("/admin/invites", {
    method: "POST",
    token,
    body: { serial_number: other.serial_number },
  });
  eligible = await request("/eligibility", {
    method: "POST",
    body: { serial_number: other.serial_number, code: inv2.body.data.code },
  });
  await db.certificate.update({
    where: { id: other.id },
    data: { status: "revoked" },
  });
  assert.equal(
    (
      await request("/register", {
        method: "POST",
        body: {
          ...fields,
          email: "second@career.test",
          grant: eligible.body.data.grant,
        },
      })
    ).status,
    409,
  );
  check("Revocation after eligibility is rechecked at account creation");
  assert.equal(
    (
      await request(`/admin/accounts/${employer.body.data.id}`, {
        method: "PATCH",
        token,
        body: { status: "blocked" },
      })
    ).status,
    200,
  );
  assert.equal((await request("/me", { cookie: ec })).status, 401);
  check("Moderation invalidates active sessions");
  await request("/logout", { method: "POST", cookie: graduateCookie });
  assert.equal((await request("/me", { cookie: graduateCookie })).status, 401);
  check("Logout revokes the server session");
  console.log(
    `${passed} checks passed. Isolated test database retained: ${testName}`,
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((r) => server.close(r));
    if (db) await db.$disconnect();
    try {
      await require("../dist/config/database").prisma.$disconnect();
    } catch {}
  });
