import fs from "fs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

export async function copyLastUpdateDate(warehouseName: string) {
  const baseDir = path.join(
    process.cwd(),
    "src",
    "data",
    "warehouses",
    warehouseName,
    "last-update.txt"
  );
  const outputDir = path.join(
    process.cwd(),
    "src",
    "data",
    "processed",
    warehouseName
  );

  try {
    await mkdir(outputDir, { recursive: true });

    const data = fs.readFileSync(baseDir, "utf8").trim();
    let date = new Date(data);

    if (isNaN(date.getTime())) {
      date = new Date(0);
      console.error("Nieprawidłowy format daty w pliku.");
    }

    await writeFile(
      path.join(outputDir, "last-update.txt"),
      date.toISOString()
    );
  } catch (error) {
    await writeFile(
      path.join(outputDir, "last-update.txt"),
      new Date(0).toISOString()
    );
    console.log("Błąd odczytu pliku:", error);
    return null;
  }
}
