import { promises as fs } from "fs";
import path from "path";
import { WarehouseItem } from "../types/warehouse";
import { parseApiloStock } from "./parseApiloStock";
import { parseActionStock } from "./parseActionStock";
import { processMolosStock } from "./parseMolosStock";

/**
 * Aggregates data from all warehouses into a single file
 */
async function parseAllStocks(): Promise<void> {
  console.log("\nℹ️ Started aggregating data from all warehouses:");

  try {
    // Fetch data from all warehouses in parallel
    const [apiloProducts, actionProducts, molosProducts] = await Promise.all([
      parseApiloStock(),
      parseActionStock(),
      processMolosStock(),
    ]);

    // Combine all products
    const allProducts: WarehouseItem[] = [
      ...apiloProducts,
      ...actionProducts,
      ...molosProducts,
    ];

    console.log("\n✓ Summary:");
    console.log(`  - Products from Apilo: ${apiloProducts.length}`);
    console.log(`  - Products from Action: ${actionProducts.length}`);
    console.log(`  - Products from Molos: ${molosProducts.length}`);
    console.log(`  - Total: ${allProducts.length}`);

    // Save combined data
    const processedDir = path.join(process.cwd(), "src", "data", "processed");
    const processedPath = path.join(processedDir, "all-stocks.json");

    await fs.writeFile(processedPath, JSON.stringify(allProducts, null, 2));
    console.log(`\n✓ Successfully saved data to: ${processedPath}\n`);
  } catch (error) {
    console.error("\n❌ Error during data aggregation:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// If the script is run directly
if (require.main === module) {
  parseAllStocks();
}

export { parseAllStocks };
