import fs from "fs/promises";
import path from "path";
import type { ScheduledMessage } from "./types";

const SCHEDULED_FILE = "scheduled.json";

export class MessageScheduler {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private authBaseDir: string;

  constructor(authBaseDir: string) {
    this.authBaseDir = authBaseDir;
  }

  private getScheduledPath(userId: string): string {
    return path.join(this.authBaseDir, userId, SCHEDULED_FILE);
  }

  private async loadFromDisk(userId: string): Promise<ScheduledMessage[]> {
    try {
      const data = await fs.readFile(this.getScheduledPath(userId), "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveToDisk(
    userId: string,
    messages: ScheduledMessage[],
  ): Promise<void> {
    const filePath = this.getScheduledPath(userId);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(messages, null, 2), "utf-8");
  }

  async schedule(
    userId: string,
    to: string,
    message: string,
    scheduledAt: Date,
    sendFn: (to: string, message: string) => Promise<void>,
  ): Promise<ScheduledMessage> {
    const scheduled: ScheduledMessage = {
      id: crypto.randomUUID(),
      userId,
      to,
      message,
      scheduledAt: scheduledAt.toISOString(),
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    const messages = await this.loadFromDisk(userId);
    messages.push(scheduled);
    await this.saveToDisk(userId, messages);

    const delay = scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      const timer = setTimeout(async () => {
        try {
          await sendFn(to, message);
          await this.markSent(userId, scheduled.id);
        } catch (err: any) {
          await this.markFailed(userId, scheduled.id, err.message);
        }
        this.timers.delete(scheduled.id);
      }, delay);
      this.timers.set(scheduled.id, timer);
    }

    return scheduled;
  }

  private async markSent(userId: string, id: string): Promise<void> {
    const messages = await this.loadFromDisk(userId);
    const idx = messages.findIndex((m) => m.id === id);
    if (idx !== -1 && messages[idx]) {
      messages[idx].status = "sent";
      await this.saveToDisk(userId, messages);
    }
  }

  private async markFailed(
    userId: string,
    id: string,
    error: string,
  ): Promise<void> {
    const messages = await this.loadFromDisk(userId);
    const idx = messages.findIndex((m) => m.id === id);
    if (idx !== -1 && messages[idx]) {
      messages[idx].status = "failed";
      messages[idx].error = error;
      await this.saveToDisk(userId, messages);
    }
  }

  async getScheduledForUser(userId: string): Promise<ScheduledMessage[]> {
    return this.loadFromDisk(userId);
  }

  async getAllScheduled(): Promise<ScheduledMessage[]> {
    const all: ScheduledMessage[] = [];
    try {
      const entries = await fs.readdir(this.authBaseDir, {
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const messages = await this.loadFromDisk(entry.name);
          all.push(...messages);
        }
      }
    } catch {}
    return all;
  }

  async cancel(userId: string, messageId: string): Promise<void> {
    const messages = await this.loadFromDisk(userId);
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) throw new Error("Scheduled message not found");

    const timer = this.timers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(messageId);
    }

    messages.splice(idx, 1);
    await this.saveToDisk(userId, messages);
  }

  async loadPendingForUser(
    userId: string,
    sendFn: (to: string, message: string) => Promise<void>,
  ): Promise<void> {
    const messages = await this.loadFromDisk(userId);
    const now = Date.now();

    for (const msg of messages) {
      if (msg.status !== "pending") continue;

      const scheduledTime = new Date(msg.scheduledAt).getTime();
      const delay = scheduledTime - now;

      if (delay <= 0) {
        try {
          await sendFn(msg.to, msg.message);
          await this.markSent(userId, msg.id);
        } catch (err: any) {
          await this.markFailed(userId, msg.id, err.message);
        }
      } else {
        const timer = setTimeout(async () => {
          try {
            await sendFn(msg.to, msg.message);
            await this.markSent(userId, msg.id);
          } catch (err: any) {
            await this.markFailed(userId, msg.id, err.message);
          }
          this.timers.delete(msg.id);
        }, delay);
        this.timers.set(msg.id, timer);
      }
    }
  }
}
