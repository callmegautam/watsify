export type WaStatus = "connecting" | "connected" | "disconnected";

export interface ScheduledMessage {
  id: string;
  userId: string;
  to: string;
  message: string;
  scheduledAt: string;
  createdAt: string;
  status: "pending" | "sent" | "failed";
  error?: string;
}
