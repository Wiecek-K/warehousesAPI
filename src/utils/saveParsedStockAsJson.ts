import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { WarehouseItem } from "../types/warehouse";

export async function saveParsedStockAsJson(
  warehouseName: string,
  warehouseStock: WarehouseItem[]
) {
  try {
    const outputDir = path.join(
      process.cwd(),
      "src",
      "data",
      "processed",
      warehouseName
    );

    await mkdir(outputDir, { recursive: true });
    await writeFile(
      path.join(outputDir, "stock.json"),
      JSON.stringify(warehouseStock, null, 2)
    );
    console.log(`✓ Successfully saved data to: ${outputDir}\n`);
  } catch (error) {
    console.error("Błąd zapisu pliku:", error);
    return null;
  }
}
