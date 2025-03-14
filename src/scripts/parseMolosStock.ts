import { parseString } from "xml2js";
import { promises as fs } from "fs";
import path from "path";
import { WarehouseItem } from "../types/warehouse";

/**
 * Reads Molos stock XML file and returns its contents
 * @returns Promise with XML file contents
 */
async function readMolosStockFile(): Promise<string> {
  try {
    const filePath = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "molos",
      "molos-stock.xml"
    );
    console.log("ℹ️ Reading Molos stock file from:", filePath);
    return await fs.readFile(filePath, "utf-8");
  } catch (error: any) {
    console.error("❌ Error reading Molos stock file:", error.message || error);
    throw error;
  }
}

/**
 * Parses XML string to JSON for Molos warehouse format and saves to file
 * @param xmlString XML data from Molos warehouse
 * @returns Array of parsed warehouse items
 */
async function parseMolosXmlToJson(
  xmlString: string
): Promise<WarehouseItem[]> {
  try {
    console.log("ℹ️ Parsing Molos XML to JSON...");

    const parseXml = (xml: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        parseString(xml, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

    const xmlDoc = await parseXml(xmlString);
    const productsElement = xmlDoc.products;
    const dateStr = productsElement?.$?.date;
    console.log(
      `ℹ️ XML data last updated at: ${
        dateStr ? new Date(dateStr).toLocaleString() : "unknown"
      }`
    );

    if (!productsElement?.product) {
      console.log("⚠️ No product elements found in XML");
      return [];
    }

    const productElements = productsElement.product;
    console.log(`ℹ️ Found ${productElements.length} product elements`);

    const items: WarehouseItem[] = [];

    for (const element of productElements) {
      const item: WarehouseItem = {
        name: "",
        quantity: 0,
        priceGross: 0,
        priceNet: 0,
        vat: 0,
        ean: "",
        source: "molos",
      };

      // Helper function to get text content of an element
      const getElementText = (field: string): string | undefined => {
        return element[field]?.[0]?.toString();
      };

      const ean = getElementText("ean");
      const priceNet = getElementText("price_net");
      const name = getElementText("name");
      const store = getElementText("store");
      const vatValue = getElementText("vat");

      if (ean) item.ean = ean;
      if (name) item.name = name;
      if (priceNet) item.priceNet = parseFloat(priceNet) || 0;
      if (store) item.quantity = parseInt(store, 10) || 0;

      if (vatValue) {
        const vatNumber = parseFloat(vatValue.replace("%", ""));
        item.vat = !isNaN(vatNumber) ? vatNumber / 100 : 0;
      }

      item.priceGross =
        item.vat && item.priceNet
          ? Number((item.priceNet * (1 + item.vat)).toFixed(2))
          : 0;

      if (item.ean) {
        items.push(item as WarehouseItem);
      }
    }

    console.log(`✓ Parsed ${items.length} items from Molos XML`);

    // Save processed data
    const outputDir = path.join(process.cwd(), "src", "data", "processed");
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, "molos-processed.json"),
      JSON.stringify(items, null, 2)
    );
    console.log(
      `✓ Successfully saved data to: src/data/processed/molos-processed.json`
    );

    return items;
  } catch (error: any) {
    console.error(
      "❌ Error parsing Molos XML to JSON:",
      error.message || error
    );
    return [];
  }
}

/**
 * Main function to process Molos stock data
 */
async function processMolosStock(): Promise<WarehouseItem[]> {
  try {
    console.log("\nℹ️ Started processing Molos stock:");
    const xmlContent = await readMolosStockFile();
    const data = await parseMolosXmlToJson(xmlContent);
    console.log("✓ Molos stock processing completed successfully");
    return data;
  } catch (error: any) {
    console.error("❌ Failed to process Molos stock:", error.message || error);
    return [];
  }
}

// If the script is run directly
if (require.main === module) {
  processMolosStock().catch(console.error);
}

export { processMolosStock };
