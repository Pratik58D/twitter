import express from "express";
import router from "./src/routes/auth.routes.js";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";

const app = express();
dotenv.config();

const port = process.env.PORT || 5000

app.use("/api/auth", router);

app.listen(port, () => {
  console.log("server is running at ",port);
  connectDB();
});
