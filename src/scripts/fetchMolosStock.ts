import { writeFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const MOLOS_URL = process.env.MOLOS_WAREHOUSE_XML_URL;

async function fetchMolosStock() {
  if (!MOLOS_URL) {
    console.error(
      "❌ Error: MOLOS_WAREHOUSE_XML_URL is not defined in .env file"
    );
    process.exit(1);
  }

  console.log("\nℹ️ Started fetching data from Molos:");
  try {
    const response = await fetch(MOLOS_URL);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}\nResponse: ${errorText}`
      );
    }

    const timestamp = new Date().toISOString();
    console.log(`✓ Successfully fetched data (${timestamp})`);

    const xmlData = await response.text();
    console.log(
      `✓ Successfully read XML content (${xmlData.length} characters)`
    );

    // Prepare directory
    const dataDir = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "molos"
    );
    const xmlPath = path.join(dataDir, "molos-stock.xml");
    const timestampPath = path.join(dataDir, "last-update.txt");

    // Save both data and timestamp files
    await Promise.all([
      writeFile(xmlPath, xmlData),
      writeFile(timestampPath, timestamp),
    ]);

    console.log(`\n✓ Successfully saved files:`);
    console.log(`  - Data file: ${xmlPath}`);
    console.log(`  - Timestamp file: ${timestampPath}\n`);
  } catch (error) {
    console.error("\n❌ Error fetching Molos data:");
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
  fetchMolosStock();
}

export { fetchMolosStock };
