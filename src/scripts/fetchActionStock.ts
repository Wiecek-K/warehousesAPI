import { writeFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const ACTION_URL = process.env.ACTION_WAREHOUSE_CSV_URL;

async function fetchActionStock() {
  if (!ACTION_URL) {
    console.error(
      "❌ Error: ACTION_WAREHOUSE_CSV_URL is not defined in .env file"
    );
    process.exit(1);
  }

  console.log("\nℹ️ Started fetching data from Action:");
  try {
    const response = await fetch(ACTION_URL);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}\nResponse: ${errorText}`
      );
    }

    const timestamp = new Date().toISOString();
    console.log(`✓ Successfully fetched data (${timestamp})`);

    const csvData = await response.text();
    console.log(
      `✓ Successfully read CSV content (${csvData.length} characters)`
    );

    // Prepare directory
    const dataDir = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "action"
    );
    const csvPath = path.join(dataDir, "stock.csv");
    const timestampPath = path.join(dataDir, "last-update.txt");

    // Save both data and timestamp files
    await Promise.all([
      writeFile(csvPath, csvData),
      writeFile(timestampPath, timestamp),
    ]);

    console.log(`\n✓ Successfully saved files:`);
    console.log(`  - Data file: ${csvPath}`);
    console.log(`  - Timestamp file: ${timestampPath}\n`);
  } catch (error) {
    console.error("\n❌ Error fetching Action data:");
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
  fetchActionStock();
}

export { fetchActionStock };
