import { writeFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

interface ApiloProduct {
  id: number;
  unit: string;
  name: string;
  weight: number;
  priceWithoutTax: number;
  sku: string;
  ean: string;
  status: 0 | 1 | 8;
  originalCode: string;
  quantity: number;
  priceWithTax: number;
  tax: string;
}

interface ApiloBatchResponse {
  products: ApiloProduct[];
  totalCount: number;
}

const APILO_URL = process.env.APILO_API_URL;
const APILO_TOKEN = process.env.APILO_ACCESS_TOKEN;

async function fetchApiloBatch(offset: number): Promise<ApiloBatchResponse> {
  if (!APILO_URL || !APILO_TOKEN) {
    throw new Error("Missing Apilo configuration in .env file");
  }

  const url = `${APILO_URL}/rest/api/warehouse/product/?limit=2000&offset=${offset}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${APILO_TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}\nResponse: ${errorText}`
    );
  }

  return response.json();
}

async function fetchApiloStock() {
  if (!APILO_URL || !APILO_TOKEN) {
    console.error("❌ Error: Apilo configuration is not defined in .env file");
    process.exit(1);
  }

  console.log("\nℹ️ Started fetching data from Apilo:");
  try {
    let allProducts: ApiloProduct[] = [];
    let offset = 0;
    let totalCount = 0;
    let batchNumber = 1;

    do {
      console.log(`\n✓ Fetching batch ${batchNumber} (offset: ${offset})...`);
      const batchResponse = await fetchApiloBatch(offset);
      const batchProducts = batchResponse.products;

      if (offset === 0) {
        totalCount = batchResponse.totalCount;
        console.log(`✓ Total product count: ${totalCount}`);
      }

      allProducts = allProducts.concat(batchProducts);
      console.log(
        `✓ Retrieved ${batchProducts.length} products (total: ${allProducts.length}/${totalCount})`
      );

      offset += batchProducts.length;
      batchNumber++;
    } while (allProducts.length < totalCount);

    const timestamp = new Date().toISOString();
    const dataDir = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "apilo"
    );
    const jsonPath = path.join(dataDir, "apilo-stock.json");
    const timestampPath = path.join(dataDir, "last-update.txt");

    // Save both data and timestamp files
    await Promise.all([
      writeFile(jsonPath, JSON.stringify(allProducts, null, 2)),
      writeFile(timestampPath, timestamp),
    ]);

    console.log(`\n✓ Successfully saved files:`);
    console.log(`  - Data file: ${jsonPath}`);
    console.log(`  - Timestamp file: ${timestampPath}`);
    console.log(
      `\nℹ️ Completed fetching from Apilo (retrieved ${allProducts.length} products)\n`
    );
  } catch (error) {
    console.error("\n❌ Error fetching Apilo data:");
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
  fetchApiloStock();
}

export { fetchApiloStock };
