import express from "express";
import cors from "cors";
import { runReferee } from "./referee.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/evaluate", (req, res) => {
  const result = runReferee(req.body);
  res.json(result);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`LandReferee API running on port ${PORT}`));