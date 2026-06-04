import { useEffect, useState, useCallback } from "react";
import { Button } from "@watsify/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@watsify/ui/components/card";
import { Loader2Icon, SmartphoneIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { getStatus, initSession, type StatusResponse } from "@/lib/whatsapp";

const STATUS_LABELS: Record<string, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
};

const STATUS_COLORS: Record<string, string> = {
  disconnected: "text-destructive",
  connecting: "text-yellow-500",
  connected: "text-green-500",
};

export default function WhatsappStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setStatus(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleInit = async () => {
    setInitializing(true);
    try {
      const data = await initSession();
      setStatus(data.status);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInitializing(false);
    }
  };

  const Icon = status?.status === "connected" ? WifiIcon : status?.status === "connecting" ? Loader2Icon : WifiOffIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Connection</CardTitle>
        <CardDescription>Connect your WhatsApp to send and schedule messages</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {loading ? (
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Icon className={`size-5 ${status?.status === "connecting" ? "animate-spin" : ""} ${STATUS_COLORS[status?.status ?? "disconnected"]}`} />
              <span className={`text-sm font-medium ${STATUS_COLORS[status?.status ?? "disconnected"]}`}>
                {STATUS_LABELS[status?.status ?? "disconnected"]}
              </span>
            </div>

            {status?.qr && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={status.qr}
                  alt="Scan QR code with WhatsApp"
                  className="size-48 border"
                />
                <p className="text-xs text-muted-foreground">
                  Scan this QR code with WhatsApp on your phone
                </p>
              </div>
            )}

            {status?.status === "disconnected" && (
              <div className="flex flex-col items-center gap-2">
                <SmartphoneIcon className="size-8 text-muted-foreground" />
                <Button onClick={handleInit} disabled={initializing}>
                  {initializing ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SmartphoneIcon className="size-4" />
                  )}
                  {initializing ? "Initializing..." : "Connect WhatsApp"}
                </Button>
              </div>
            )}

            {status?.status === "connected" && (
              <p className="text-xs text-muted-foreground">
                WhatsApp is connected and ready to send messages
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
