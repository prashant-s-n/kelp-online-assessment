import { loadRootConfigurations } from "../load";

loadRootConfigurations();

import express, { Express, Request, Response } from "express";

import ConfigLoader from "./libs/config";

import { ConvertCSVToJSONService } from "./services";

const config = new ConfigLoader().load();

const app: Express = express();

const port = config.application.port;

app.get("/process-csv", (req: Request, res: Response) => {
  new ConvertCSVToJSONService().processCSVToJSON();
  res.send('ok');
});

app.listen(port, () => {
  console.log(`[Server]: Server is running at http://localhost:${port}`);
});