import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import path from "path";
import pino from "pino";
import QRCode from "qrcode";
import qrcode from "qrcode-terminal";

export type WaStatus = "connecting" | "connected" | "disconnected";

class WhatsAppManager {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private status: WaStatus = "disconnected";
  private qrCodeBase64: string | null = null;
  private authDir: string;

  constructor() {
    this.authDir = path.join(process.cwd(), "wa_auth");
  }

  getStatus() {
    return { status: this.status, qr: this.qrCodeBase64 };
  }

  async init() {
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

    const logger = pino({ level: "silent" });

    this.socket = makeWASocket({
      auth: state,
      logger,
    });

    this.socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCodeBase64 = await QRCode.toDataURL(qr);
        console.log("\nScan this QR code with WhatsApp to log in:\n");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "connecting") {
        this.status = "connecting";
      } else if (connection === "close") {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        this.status = "disconnected";
        this.qrCodeBase64 = null;

        if (shouldReconnect) {
          this.init();
        }
      } else if (connection === "open") {
        this.status = "connected";
        this.qrCodeBase64 = null;
      }
    });

    this.socket.ev.on("creds.update", saveCreds);
  }

  async sendMessage(to: string, message: string) {
    if (!this.socket || this.status !== "connected") {
      throw new Error("WhatsApp not connected");
    }

    const jid = `${to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
    await this.socket.sendMessage(jid, { text: message });
  }

  async scheduleMessage(to: string, message: string, scheduledAt: Date) {
    const delay = scheduledAt.getTime() - Date.now();
    if (delay <= 0) {
      throw new Error("Scheduled time must be in the future");
    }

    setTimeout(() => {
      this.sendMessage(to, message).catch((err) => {
        console.error("Failed to send scheduled message:", err);
      });
    }, delay);
  }
}

export const waManager = new WhatsAppManager();
