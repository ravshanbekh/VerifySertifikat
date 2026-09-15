// Provision only an isolated local development database. Never reuse the Verify DB.
require("dotenv").config({ quiet: true });
const { PrismaClient } = require("@prisma/client");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const source = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(source.hostname))
  throw new Error("Career dev setup requires a local PostgreSQL server.");
const target = new URL(source);
target.pathname = "/itlive_career_dev";
async function main() {
  const admin = new URL(source);
  admin.pathname = "/postgres";
  const db = new PrismaClient({
    datasources: { db: { url: admin.toString() } },
  });
  const exists =
    await db.$queryRaw`SELECT datname FROM pg_database WHERE datname='itlive_career_dev'`;
  if (!exists.length)
    await db.$executeRawUnsafe('CREATE DATABASE "itlive_career_dev"');
  await db.$disconnect();
  const env = { ...process.env, DATABASE_URL: target.toString() };
  const run = (args) => {
    const r = spawnSync(
      process.execPath,
      [path.join("node_modules", "prisma", "build", "index.js"), ...args],
      { env, encoding: "utf8" },
    );
    if (r.status !== 0) throw new Error(r.stderr);
    process.stdout.write(r.stdout);
  };
  run(["migrate", "deploy"]);
  if (process.argv.includes("--diff"))
    run([
      "migrate",
      "diff",
      "--from-url",
      target.toString(),
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--script",
    ]);
  console.log("Isolated Career development database ready.");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
