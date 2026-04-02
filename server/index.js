import dotenv from "dotenv";
dotenv.config();

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "din-openai-nyckel-här") {
  console.error("FEL: OPENAI_API_KEY saknas eller är ej satt i .env");
  process.exit(1);
}

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
