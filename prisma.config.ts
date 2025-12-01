import { config } from "dotenv";
config({ path: ".env" }); // injection forcée des variables d'env

import { defineConfig } from "prisma/config";

const directUrl = process.env.DIRECT_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!directUrl || !databaseUrl) {
  throw new Error("DIRECT_URL and DATABASE_URL env vars are required in prisma.config.ts");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
