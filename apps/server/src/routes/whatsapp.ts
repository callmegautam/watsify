import { Router } from "express";
import { waManager } from "@/whatsapp/manager";

const router: Router = Router();

const DEFAULT_USER_ID = "default";

router.get("/status", (_req, res) => {
  res.json(waManager.getStatus(DEFAULT_USER_ID));
});

router.post("/init", async (_req, res) => {
  try {
    const session = await waManager.getOrCreateSession(DEFAULT_USER_ID);
    res.json({ success: true, status: session.getStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/send", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    res.status(400).json({ error: "Missing required fields: to, message" });
    return;
  }

  const session = waManager.getSession(DEFAULT_USER_ID);
  if (!session) {
    res
      .status(400)
      .json({ error: "WhatsApp not initialized. Call /init first." });
    return;
  }

  try {
    await session.sendMessage(to, message);
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

  const session = waManager.getSession(DEFAULT_USER_ID);
  if (!session) {
    res
      .status(400)
      .json({ error: "WhatsApp not initialized. Call /init first." });
    return;
  }

  try {
    const scheduled = await waManager.scheduler.schedule(
      DEFAULT_USER_ID,
      to,
      message,
      new Date(scheduledAt),
      (to, msg) => session.sendMessage(to, msg),
    );
    res.json({ success: true, scheduled });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/scheduled", async (_req, res) => {
  const messages = await waManager.scheduler.getScheduledForUser(DEFAULT_USER_ID);
  res.json({ messages });
});

router.get("/admin/scheduled", async (_req, res) => {
  const messages = await waManager.scheduler.getAllScheduled();
  res.json({ messages });
});

router.post("/cancel-scheduled", async (req, res) => {
  const { messageId } = req.body;

  if (!messageId) {
    res.status(400).json({ error: "Missing messageId" });
    return;
  }

  try {
    await waManager.scheduler.cancel(DEFAULT_USER_ID, messageId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
