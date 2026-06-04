import waRoutes from "@/routes/whatsapp";
import { waManager } from "@/whatsapp/manager";
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/whatsapp", waRoutes);

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

waManager.initExistingSessions().then(() => {
  waManager.loadPendingScheduledMessages();
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
