import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../prisma/generated/client";
import { getEnvOrExit } from "./getEnvOrExit";

const connectionString = getEnvOrExit("DATABASE_URL");
const adapter = new PrismaBetterSqlite3({ url: connectionString });

export const prismaClient = new PrismaClient({ adapter });