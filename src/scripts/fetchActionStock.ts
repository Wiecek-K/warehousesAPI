import { writeFile } from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const ACTION_URL = process.env.ACTION_WAREHOUSE_CSV_URL;
const FETCH_TIMEOUT = 20 * 60 * 1000; // 20 minut timeout
const MEMORY_LOG_INTERVAL = 30000; // 30 sekund
const MAX_RETRIES = 3; // Maksymalna liczba prób
const RETRY_DELAY = 5000; // 5 sekund opóźnienia między próbami

function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log("Memory usage:", {
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`,
    arrayBuffers: `${Math.round(used.arrayBuffers / 1024 / 1024)} MB`,
  });
}

async function fetchWithRetry(
  url: string,
  retriesLeft: number = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;
  let memoryInterval: NodeJS.Timeout | undefined;

  try {
    console.log(`🔄 Attempt ${MAX_RETRIES - retriesLeft + 1}/${MAX_RETRIES}`);

    // Inicjalizacja timeoutu
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(
          new Error(
            `Request timed out after ${FETCH_TIMEOUT / 1000 / 60} minutes`
          )
        );
      }, FETCH_TIMEOUT);
    });

    // Monitorowanie pamięci
    memoryInterval = setInterval(logMemoryUsage, MEMORY_LOG_INTERVAL);

    const response = await Promise.race([
      fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/csv",
        },
      }),
      timeoutPromise,
    ]);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}\nResponse: ${errorText}`
      );
    }

    return response;
  } catch (error) {
    if (retriesLeft <= 1) throw error;

    console.error(
      `❌ Attempt failed (${
        error instanceof Error ? error.message : error
      }). Retrying in ${RETRY_DELAY / 1000} seconds...`
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    return fetchWithRetry(url, retriesLeft - 1);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (memoryInterval) clearInterval(memoryInterval);
  }
}

async function fetchActionStock() {
  if (!ACTION_URL) {
    console.error(
      "❌ Error: ACTION_WAREHOUSE_CSV_URL is not defined in .env file"
    );
    return 1;
  }

  try {
    console.log(
      "\nℹ️ Started fetching data from Action (20m timeout, 3 retries)"
    );
    logMemoryUsage();

    const response = await fetchWithRetry(ACTION_URL);
    const csvData = await response.text();
    const timestamp = new Date().toISOString();

    const dataDir = path.join(
      process.cwd(),
      "src",
      "data",
      "warehouses",
      "action"
    );
    await Promise.all([
      writeFile(path.join(dataDir, "stock.csv"), csvData),
      writeFile(path.join(dataDir, "last-update.txt"), timestamp),
    ]);

    console.log(`\n✓ Successfully saved ACTION files:`);
    return 0;
  } catch (error) {
    console.error("\n❌ All attempts failed:");
    if (error instanceof Error) {
      console.error(error.message);
    }
    return 1;
  }
}

if (require.main === module) {
  fetchActionStock();
}

export { fetchActionStock };
