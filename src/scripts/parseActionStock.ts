import { readFile, writeFile } from "fs/promises";
import path from "path";
import { WarehouseItem } from "../types/warehouse";

interface ActionProduct {
  grupa_towarowa: string;
  podgrupa_towarowa: string;
  producent: string;
  nazwa_produktu: string;
  cena_netto_pln: string;
  cena_brutto_pln: string;
  kod_produktu: string;
  gwarancja: string;
  stan_mag: string;
  kod_producenta: string;
  ean: string;
  produkt_gabarytowy: string;
  produkt_z_magazynu_zewnetrznego: string;
  pod_zamowienie: string;
  czas_wysylki: string;
  data_spodziewanej_dostawy: string;
  ilosc_w_spodziewanej_dostawie: string;
  nadgrupa_drzewo: string;
  grupa_drzewo: string;
  podgrupa_drzewo: string;
  czas_wysylki_h: string;
}

/**
 * Parse price string to number
 * @param price Price string
 * @returns Parsed price as number
 */
function parsePrice(price: string): number {
  // Remove spaces and replace comma with dot
  const cleanValue = price.replace(/\s/g, "").replace(",", ".");
  const number = parseFloat(cleanValue);
  if (isNaN(number)) throw new Error(`Invalid price: ${price}`);
  return number;
}

/**
 * Calculate VAT rate from net and gross prices
 * @param netPrice Net price string
 * @param grossPrice Gross price string
 * @returns VAT rate as decimal
 */
function calculateVat(netPrice: string, grossPrice: string): number {
  const net = parsePrice(netPrice);
  const gross = parsePrice(grossPrice);
  if (net === 0) return 0;
  const vatRate = (gross - net) / net;
  return Math.round(vatRate * 100) / 100; // Round to 2 decimal places
}

/**
 * Parse quantity string to number
 * @param quantity Quantity string
 * @returns Parsed quantity as number
 */
function parseQuantity(quantity: string): number {
  const cleanValue = quantity.replace(/\s/g, "");
  const number = parseInt(cleanValue, 10);
  if (isNaN(number)) throw new Error(`Invalid quantity: ${quantity}`);
  return number;
}

/**
 * Parses Action stock data from CSV file
 * @returns Promise with array of parsed warehouse items
 */
async function parseActionStock(): Promise<WarehouseItem[]> {
  console.log("\nℹ️ Started parsing Action data:");
  try {
    const baseDir = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "action"
    );
    const filePath = path.join(baseDir, "action-stock.csv");

    const rawData = await readFile(filePath, "utf-8");
    const lines = rawData.split("\n");

    // Remove quotes from headers and split by comma
    const headers = lines[0]
      .trim()
      .replace(/^"/, "")
      .replace(/"$/, "")
      .split('","')
      .map((header) =>
        header
          .toLowerCase()
          .replace(/\s+/g, "_")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      );

    const actionProducts: ActionProduct[] = [];
    const errors: string[] = [];

    // Parse each line
    lines.slice(1).forEach((line, index) => {
      if (line.trim() === "") return;

      try {
        // Split line into values, preserving quoted values
        const values = line
          .trim()
          .replace(/^"/, "")
          .replace(/"$/, "")
          .split('","')
          .map((value) => value.trim());

        if (values.length !== headers.length) {
          throw new Error(
            `Invalid column count: ${values.length}, expected: ${headers.length}`
          );
        }

        // Create product object
        const product = headers.reduce((acc, header, i) => {
          acc[header as keyof ActionProduct] = values[i];
          return acc;
        }, {} as ActionProduct);

        actionProducts.push(product);
      } catch (error) {
        errors.push(
          `Row #${index + 2}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    });

    if (errors.length > 0) {
      console.warn("\n⚠️ Found errors in the data:");
      errors.forEach((error) => console.warn(`  - ${error}`));
    }

    console.log(`✓ Loaded ${actionProducts.length} products from CSV file`);

    // Convert to common format
    const parsedProducts = actionProducts
      .map((product, index) => {
        try {
          const parsed: WarehouseItem = {
            ean: product.ean,
            name: product.nazwa_produktu,
            quantity: parseQuantity(product.stan_mag),
            priceGross: parsePrice(product.cena_brutto_pln),
            priceNet: parsePrice(product.cena_netto_pln),
            vat: calculateVat(product.cena_netto_pln, product.cena_brutto_pln),
            source: "action",
          };

          return parsed;
        } catch (error) {
          console.warn(
            `⚠️ Skipped product #${index + 2} due to error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          return null;
        }
      })
      .filter((product): product is WarehouseItem => product !== null);

    console.log(
      `✓ Converted ${parsedProducts.length} products to common format`
    );
    if (parsedProducts.length < actionProducts.length) {
      console.warn(
        `⚠️ Skipped ${
          actionProducts.length - parsedProducts.length
        } products due to errors`
      );
    }

    // Save processed data
    const processedDir = path.join(process.cwd(), "src", "data", "processed");
    const processedPath = path.join(processedDir, "action-processed.json");

    await writeFile(processedPath, JSON.stringify(parsedProducts, null, 2));
    console.log(`✓ Successfully saved data to: ${processedPath}\n`);

    return parsedProducts;
  } catch (error) {
    console.error("\n❌ Error parsing Action data:");
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
  parseActionStock();
}

export { parseActionStock };
