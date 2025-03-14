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
      ...molosProducts,
      ...actionProducts,
    ];

    // Group products by their EAN code
    const groupedProducts = allProducts.reduce<Record<string, WarehouseItem[]>>(
      (acc, product) => {
        if (!acc[product.ean]) {
          acc[product.ean] = [];
        }
        acc[product.ean].push(product);
        return acc;
      },
      {}
    );

    // Transform grouped data into desired structure:
    // Each object contains the EAN and an array "availableOn" with details per warehouse.
    const aggregatedData = Object.keys(groupedProducts).map((ean) => ({
      ean,
      availableOn: groupedProducts[ean].map(({ ean, ...rest }) => rest),
    }));

    console.log("\n✓ Summary:");
    console.log(`  - Products from Apilo: ${apiloProducts.length}`);
    console.log(`  - Products from Action: ${actionProducts.length}`);
    console.log(`  - Products from Molos: ${molosProducts.length}`);
    console.log(`  - Unique Products: ${aggregatedData.length}`);
    console.log(`  - Total: ${allProducts.length}`);

    // Save combined data
    const processedDir = path.join(process.cwd(), "src", "data", "processed");
    const processedPath = path.join(processedDir, "all-stocks.json");

    await fs.writeFile(processedPath, JSON.stringify(aggregatedData, null, 2));
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
