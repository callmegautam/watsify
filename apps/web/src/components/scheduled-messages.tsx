import { useCallback, useEffect, useState } from "react";
import { Button } from "@watsify/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@watsify/ui/components/card";
import { Skeleton } from "@watsify/ui/components/skeleton";
import { CalendarIcon, ClockIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { cancelScheduledMessage, getScheduledMessages, type ScheduledMessage } from "@/lib/whatsapp";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function statusBadge(status: ScheduledMessage["status"]) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-500",
    sent: "bg-green-500/20 text-green-500",
    failed: "bg-destructive/20 text-destructive",
  };
  return styles[status] ?? "";
}

export default function ScheduledMessages() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getScheduledMessages();
      setMessages(data.messages);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleCancel = async (messageId: string) => {
    setCancelling(messageId);
    try {
      await cancelScheduledMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message cancelled");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Messages</CardTitle>
        <CardDescription>Messages queued for future delivery</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled messages yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start justify-between gap-2 rounded-none border p-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{msg.to}</span>
                    <span className={`rounded-none px-1.5 py-0.5 text-[10px] font-medium ${statusBadge(msg.status)}`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {truncate(msg.message, 60)}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {formatDate(msg.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  {msg.error && (
                    <p className="text-[10px] text-destructive">{msg.error}</p>
                  )}
                </div>
                {msg.status === "pending" && (
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => handleCancel(msg.id)}
                    disabled={cancelling === msg.id}
                  >
                    {cancelling === msg.id ? (
                      <Loader2Icon className="size-3 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-3" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
