import { writeFile } from "fs/promises";

import path from "path";
import { WarehouseItem } from "../types/warehouse";
import { parseApiloStock } from "./parseApiloStock";
import { parseActionStock } from "./parseActionStock";
import { processMolosStock } from "./parseMolosStock";
import { readProcessedTimestamp } from "../utils/readProcessedTimestamp";

const combineTimestamps = (warehouseNames: string[]) => {
  const data: { warehouseName: string; lastUpdateDate: Date }[] = [];

  warehouseNames.forEach((warehouseName) => {
    data.push({
      warehouseName,
      lastUpdateDate: readProcessedTimestamp(warehouseName),
    });
  });

  return data;
};

/**
 * Aggregates data from all warehouses into a single file
 */
async function parseAllStocks(): Promise<void> {
  console.log("\nℹ️ Started aggregating data from all warehouses:");
  const warehouses = ["apilo", "action", "molos"];

  try {
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

    console.log(`\n`);
    const warehouseTimestamps = combineTimestamps(warehouses);
    warehouseTimestamps.forEach((warehouse) =>
      console.log(
        `Last update for ${warehouse.warehouseName}: ${warehouse.lastUpdateDate}`
      )
    );

    console.log("\n✓ Summary:");
    console.log(`  - Products from Apilo: ${apiloProducts.length}`);
    console.log(`  - Products from Action: ${actionProducts.length}`);
    console.log(`  - Products from Molos: ${molosProducts.length}`);
    console.log(`  - Unique Products: ${aggregatedData.length}`);
    console.log(`  - Total: ${allProducts.length}`);
    console.log(`  - Unique Products: ${aggregatedData.length}`);

    // Save combined data
    const processedDir = path.join(process.cwd(), "src", "data", "processed");
    const processedStockPath = path.join(processedDir, "all-stocks.json");
    const processedTimestampPath = path.join(processedDir, "last-update.json");

    await writeFile(
      processedStockPath,
      JSON.stringify(aggregatedData, null, 2)
    );
    await writeFile(
      processedTimestampPath,
      JSON.stringify(warehouseTimestamps, null, 2)
    );

    console.log(`\n✓ Successfully saved data to: ${processedStockPath}\n`);
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
