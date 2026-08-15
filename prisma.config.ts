import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Plain process.env access on purpose, not the `env()` helper: `env()`
    // throws as soon as this config file loads, which breaks `prisma
    // generate` (it doesn't need a live database) on a fresh install where
    // DATABASE_URL isn't set yet — e.g. Vercel's first build, before a
    // database is attached. Commands that do need a connection (`migrate
    // deploy`, `db seed`) still fail clearly on their own when it's missing.
    url: process.env.DATABASE_URL,
  },
});
