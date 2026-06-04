import WhatsappStatus from "@/components/whatsapp-status";
import SendMessage from "@/components/send-message";
import ScheduleMessage from "@/components/schedule-message";
import ScheduledMessages from "@/components/scheduled-messages";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-lg font-medium">WhatsApp Manager</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <WhatsappStatus />
        <div className="flex flex-col gap-6">
          <SendMessage />
          <ScheduleMessage />
        </div>
      </div>
      <ScheduledMessages />
    </div>
  );
}
