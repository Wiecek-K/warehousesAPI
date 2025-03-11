import { readFile, writeFile } from "fs/promises";
import path from "path";
import { WarehouseItem } from "../types/warehouse";

type ApiloStatus = 0 | 1 | 8;

interface ApiloProduct {
  id: number;
  sku: string;
  ean: string | null;
  name: string;
  unit: string | null;
  weight: number | null;
  quantity: number;
  priceWithTax: number;
  priceWithoutTax: number;
  tax: string;
  originalCode: string | null;
  status: ApiloStatus;
}

/**
 * Parses Apilo stock data from JSON file
 * @returns Promise with array of parsed warehouse items
 */
async function parseApiloStock(): Promise<WarehouseItem[]> {
  console.log("\nℹ️ Started parsing Apilo data:");
  try {
    const baseDir = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "apilo"
    );
    const filePath = path.join(baseDir, "apilo-stock.json");

    const rawData = await readFile(filePath, "utf-8");
    const apiloProducts: ApiloProduct[] = JSON.parse(rawData);
    console.log(`✓ Loaded ${apiloProducts.length} products from JSON file`);

    const parsedProducts: WarehouseItem[] = apiloProducts.map((product) => ({
      ean: product.ean || "",
      name: product.name,
      quantity: product.quantity,
      priceNet: product.priceWithoutTax,
      priceGross: product.priceWithTax,
      vat: Number(product.tax.replace("%", "")) / 100,
      source: "apilo",
    }));

    console.log(
      `✓ Converted ${parsedProducts.length} products to common format`
    );

    // Save processed data
    const processedDir = path.join(process.cwd(), "src", "data", "processed");
    const processedPath = path.join(processedDir, "apilo-processed.json");

    await writeFile(processedPath, JSON.stringify(parsedProducts, null, 2));
    console.log(`✓ Successfully saved data to: ${processedPath}\n`);

    return parsedProducts;
  } catch (error) {
    console.error("\n❌ Error while parsing Apilo data:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    return [];
  }
}

// If the script is run directly
if (require.main === module) {
  parseApiloStock();
}

export { parseApiloStock };
