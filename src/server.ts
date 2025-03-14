import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { AggregatedProduct } from "./types/warehouse";
import path from "path";
import fs from "fs/promises";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Express + TypeScript Server" });
});
/**
 * Loads all warehouse stock data from JSON file
 * @returns Promise with array of warehouse items
 */
async function loadAllStocksData(): Promise<AggregatedProduct[]> {
  try {
    const filePath = path.join(
      process.cwd(),
      "src",
      "data",
      "processed",
      "all-stocks.json"
    );

    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as AggregatedProduct[];
  } catch (error: any) {
    console.error("Error loading stocks data:", error.message || error);
    return [];
  }
}

// GET endpoint for retrieving a product by EAN
app.get("/productByEan", (req: Request, res: Response) => {
  (async () => {
    try {
      const ean = req.query.ean as string;

      // Validate input
      if (!ean) {
        return res.status(400).json({
          error:
            "Invalid request. Please provide an EAN number as a query parameter.",
        });
      }

      // Load stock data
      const allStocks = await loadAllStocksData();

      if (allStocks.length === 0) {
        return res.status(500).json({
          error: "Failed to load stock data or no stock data available.",
        });
      }
      // Find product by EAN
      const product = allStocks.find((product) => product.ean === ean);

      const notFoundProduct: AggregatedProduct = {
        ean,
        availableOn: [],
      };

      if (!product) {
        console.log(`Product with EAN ${ean} not found`);
        return res.json({
          product: notFoundProduct,
        });
      }

      console.log(
        `Found product with EAN ${ean} in: ${
          product.availableOn?.length ? product.availableOn.length : 0
        } warehouses`
      );

      res.json(product);
    } catch (error: any) {
      console.error("Error processing request:", error.message || error);
      res.status(500).json({
        error: "Internal server error.",
      });
    }
  })();
});

// Define the routes
app.post("/productsByEan", function (req, res) {
  (async () => {
    try {
      const eanArray = req.body.eans;

      // Validate input
      if (!eanArray || !Array.isArray(eanArray)) {
        return res.status(400).json({
          error:
            "Invalid request. Please provide an array of EAN numbers in the request body.",
        });
      }

      // Load stock data
      const allStocks = await loadAllStocksData();

      if (allStocks.length === 0) {
        return res.status(500).json({
          error: "Failed to load stock data or no stock data available.",
        });
      }

      // Filter products by EAN
      const matchingProducts = allStocks.filter((product) =>
        eanArray.includes(product.ean)
      );

      console.log(
        `Found ${matchingProducts.length} products matching ${eanArray.length} EAN numbers`
      );

      res.json({
        products: matchingProducts,
        total: matchingProducts.length,
      });
    } catch (error: any) {
      console.error("Error processing request:", error.message || error);
      res.status(500).json({
        error: "Internal server error.",
      });
    }
  })();
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
