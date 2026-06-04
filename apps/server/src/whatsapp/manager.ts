import fs from "fs";
import path from "path";
import { UserSession } from "./user-session";
import { MessageScheduler } from "./scheduler";
import type { WaStatus } from "./types";

export class WhatsAppManager {
  private sessions: Map<string, UserSession> = new Map();
  private authBaseDir: string;
  readonly scheduler: MessageScheduler;

  constructor() {
    this.authBaseDir = path.join(process.cwd(), "wa_auth");
    this.scheduler = new MessageScheduler(this.authBaseDir);
  }

  async getOrCreateSession(userId: string): Promise<UserSession> {
    let session = this.sessions.get(userId);
    if (!session) {
      session = new UserSession(userId, this.authBaseDir);
      this.sessions.set(userId, session);
      await session.init();
    }
    return session;
  }

  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }

  removeSession(userId: string): void {
    this.sessions.delete(userId);
  }

  getStatus(userId: string) {
    const session = this.sessions.get(userId);
    if (!session) {
      return { status: "disconnected" as WaStatus, qr: null, userId };
    }
    return session.getStatus();
  }

  async initExistingSessions(): Promise<void> {
    try {
      const entries = fs.readdirSync(this.authBaseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const credsPath = path.join(
            this.authBaseDir,
            entry.name,
            "creds.json",
          );
          if (fs.existsSync(credsPath)) {
            const session = new UserSession(entry.name, this.authBaseDir);
            this.sessions.set(entry.name, session);
            await session.init();
          }
        }
      }
    } catch {}
  }

  async loadPendingScheduledMessages(): Promise<void> {
    for (const [userId] of this.sessions) {
      const session = this.sessions.get(userId);
      if (session) {
        await this.scheduler.loadPendingForUser(userId, (to, msg) =>
          session.sendMessage(to, msg),
        );
      }
    }
  }
}

export const waManager = new WhatsAppManager();
