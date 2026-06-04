import { env } from "@watsify/env/web";

const BASE = `${env.VITE_SERVER_URL}/api/whatsapp`;

export type WaStatus = "connecting" | "connected" | "disconnected";

export interface StatusResponse {
  status: WaStatus;
  qr: string | null;
  userId: string;
}

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

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function getStatus() {
  return api<StatusResponse>("/status");
}

export function initSession() {
  return api<{ success: boolean; status: StatusResponse }>("/init", { method: "POST" });
}

export function sendMessage(to: string, message: string) {
  return api<{ success: boolean }>("/send", {
    method: "POST",
    body: JSON.stringify({ to, message }),
  });
}

export function scheduleMessage(to: string, message: string, scheduledAt: string) {
  return api<{ success: boolean; scheduled: ScheduledMessage }>("/schedule", {
    method: "POST",
    body: JSON.stringify({ to, message, scheduledAt }),
  });
}

export function getScheduledMessages() {
  return api<{ messages: ScheduledMessage[] }>("/scheduled");
}

export function cancelScheduledMessage(messageId: string) {
  return api<{ success: boolean }>("/cancel-scheduled", {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}
