const express = require("express");
const cron = require('./scheduledFunctions/scraper');
const app = express();
const cors = require("cors");
app.use(cors())
app.set("port", process.env.PORT || 3000);

const Client = require("pg").Client;
const config = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
}
const client = new Client(config);
cron.initScheduledJobs(config);
app.get('/gasprices', async function(req, res) {
const query = `
SELECT * 
FROM gas_price 
ORDER BY "on" DESC
`
let gas = await client.query(query);
  res.send(
    gas.rows
  );
});

app.listen(app.get("port"), async () => {
  await client.connect();
  console.log("Express server listening on port " + app.get("port"));
});
