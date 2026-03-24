import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDefaultDatabase } from "./default-database.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const dataDirectoryPath = path.resolve(currentDirectoryPath, "../../data");
const databaseFilePath = path.join(dataDirectoryPath, "db.json");

const ensureDatabaseFile = async () => {
  await fs.mkdir(dataDirectoryPath, { recursive: true });

  try {
    await fs.access(databaseFilePath);
  } catch {
    const initialContent = JSON.stringify(createDefaultDatabase(), null, 2);

    await fs.writeFile(databaseFilePath, initialContent, "utf8");
  }
};

export const readDatabase = async () => {
  await ensureDatabaseFile();

  const rawDatabase = await fs.readFile(databaseFilePath, "utf8");

  return JSON.parse(rawDatabase);
};

export const writeDatabase = async (nextDatabase) => {
  await ensureDatabaseFile();

  const serializedDatabase = JSON.stringify(nextDatabase, null, 2);

  await fs.writeFile(databaseFilePath, serializedDatabase, "utf8");

  return nextDatabase;
};

export const mutateDatabase = async (mutator) => {
  const database = await readDatabase();
  const nextDatabase = structuredClone(database);
  const result = await mutator(nextDatabase);

  await writeDatabase(nextDatabase);

  return result;
};

export const getDatabaseFilePath = () => databaseFilePath;
