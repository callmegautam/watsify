import { Router } from "express";
import { waManager } from "@/whatsapp/manager";
import { requireAuth } from "@/middleware/auth";

const router: Router = Router();

router.use(requireAuth);

router.get("/status", (req, res) => {
  const userId = (req as any).userId;
  res.json(waManager.getStatus(userId));
});

router.post("/init", async (req, res) => {
  const userId = (req as any).userId;
  try {
    const session = await waManager.getOrCreateSession(userId);
    res.json({ success: true, status: session.getStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/send", async (req, res) => {
  const userId = (req as any).userId;
  const { to, message } = req.body;

  if (!to || !message) {
    res.status(400).json({ error: "Missing required fields: to, message" });
    return;
  }

  const session = waManager.getSession(userId);
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
  const userId = (req as any).userId;
  const { to, message, scheduledAt } = req.body;

  if (!to || !message || !scheduledAt) {
    res
      .status(400)
      .json({ error: "Missing required fields: to, message, scheduledAt" });
    return;
  }

  const session = waManager.getSession(userId);
  if (!session) {
    res
      .status(400)
      .json({ error: "WhatsApp not initialized. Call /init first." });
    return;
  }

  try {
    const scheduled = await waManager.scheduler.schedule(
      userId,
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

router.get("/scheduled", async (req, res) => {
  const userId = (req as any).userId;
  const messages = await waManager.scheduler.getScheduledForUser(userId);
  res.json({ messages });
});

router.get("/admin/scheduled", async (_req, res) => {
  const messages = await waManager.scheduler.getAllScheduled();
  res.json({ messages });
});

router.post("/cancel-scheduled", async (req, res) => {
  const userId = (req as any).userId;
  const { messageId } = req.body;

  if (!messageId) {
    res.status(400).json({ error: "Missing messageId" });
    return;
  }

  try {
    await waManager.scheduler.cancel(userId, messageId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
