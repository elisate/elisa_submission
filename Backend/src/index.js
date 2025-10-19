import express from "express";
import cors from "cors";
import userRouter from "./Routes/userRoutes.js";
import { getPublicKey } from "./crypto/signer.js";
import mainRouter from "./Routes/indexRouting.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Public key endpoint for frontend
app.get("/keys/public", (req, res) => {
  res.type("text/plain").send(getPublicKey());
});

app.use("/api_v1",mainRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port http://localhost:${PORT}`));
