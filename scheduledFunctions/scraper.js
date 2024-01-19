require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const CronJob = require("node-cron");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const Client = require("pg").Client;
const pageUrl = `https://snowtrace.io/`;


/*
  scrape gas price from webpage
  save result to database
*/
async function fetchGasPrice(config) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(60000);
  await page.goto(pageUrl);
  await page.waitForSelector('.new-line-xxs');

  // scrape data by 2nd anchor tag /gastracker
  const elements = await page.$$(`a[href="/gastracker"]`);
  const gasUsd = await page.evaluate((el) => el.parentNode.innerText, elements[1]);
  const gas = gasUsd.split('\n')[1]
  await browser.close();
  const client = new Client(config);
  await client.connect();

  // save to database
  const insertQuery = `INSERT INTO gas_prices (cost) VALUES ($1)`;
    const values = [gas];
    try {
      await client.query(insertQuery, values);
    } catch (err) {
      console.error(`Error inserting URL "${url}":`, err);
    }

  await client.end();
  console.log(`GAS: ${gas} at ${Date()}`)
}


// set job scheduler
exports.initScheduledJobs = (config) => {
  // set the interval here
  const scheduledJobFunction = CronJob.schedule(`*/4 * * * *`, async () => {
    await fetchGasPrice(config);
  });
  scheduledJobFunction.start();
}