import { Router } from "express";
import { waManager } from "@/whatsapp/manager";

const router: Router = Router();

router.get("/status", (_req, res) => {
  res.json(waManager.getStatus());
});

router.post("/send", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    res.status(400).json({ error: "Missing required fields: to, message" });
    return;
  }

  try {
    await waManager.sendMessage(to, message);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/schedule", async (req, res) => {
  const { to, message, scheduledAt } = req.body;

  if (!to || !message || !scheduledAt) {
    res
      .status(400)
      .json({ error: "Missing required fields: to, message, scheduledAt" });
    return;
  }

  try {
    await waManager.scheduleMessage(to, message, new Date(scheduledAt));
    res.json({ success: true, scheduledAt });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
