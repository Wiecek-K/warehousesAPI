import cron from "node-cron";
import { fetchActionStock } from "../scripts/fetchActionStock";
import { fetchMolosStock } from "../scripts/fetchMolosStock";
import { fetchApiloStock } from "../scripts/fetchApiloStock";
import { parseAllStocks } from "../scripts/parseAllStocks";

export function startCronJobs() {
  cron.schedule("* */4 * * *", async () => {
    console.log("Running cron job...");

    await Promise.allSettled([
      fetchActionStock(),
      fetchMolosStock(),
      fetchApiloStock(),
    ]);

    parseAllStocks();
  });

  console.log("Cron jobs initialized");
}
