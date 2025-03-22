import fs from "fs";
import path from "path";

export const readProcessedTimestamp = (warehouseName: string) => {
  const baseDir = path.join(process.cwd(), "src", "data", "processed");
  const filePath = path.join(baseDir, warehouseName, "last-update.txt");

  const data = fs.readFileSync(filePath, "utf8").trim();
  let date = new Date(data);

  if (isNaN(date.getTime())) {
    date = new Date(0);
    console.error(
      `Nieprawidłowy format daty w pliku dla ${warehouseName.toLocaleUpperCase()}.`
    );
  }
  return date;
};
