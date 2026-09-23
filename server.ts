import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { handleApiRoute } from "./src/server/apiHandler.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith("/api/")) {
    try {
      const handled = await handleApiRoute(req, res);
      if (!handled) next();
    } catch (err) {
      console.error("API Error:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  } else {
    next();
  }
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`MATTEROS legal intelligence server running on port ${PORT}`);
});
