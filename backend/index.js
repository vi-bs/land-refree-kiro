import express from "express";
import bodyParser from "body-parser";
import { runReferee } from "./referee.js";

const app = express();
app.use(bodyParser.json());

app.post("/evaluate", async (req, res) => {
  const constraints = req.body;
  const result = await runReferee(constraints);
  res.json(result);
});

app.listen(3000, () => {
  console.log("LandReferee API running on port 3000");
});