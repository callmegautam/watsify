import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@watsify/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@watsify/ui/components/card";
import { Input } from "@watsify/ui/components/input";
import { Label } from "@watsify/ui/components/label";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { scheduleMessage } from "@/lib/whatsapp";

const schema = z.object({
  to: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
  scheduledAt: z.string().min(1, "Schedule time is required"),
});

export default function ScheduleMessage() {
  const form = useForm({
    defaultValues: { to: "", message: "", scheduledAt: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        const scheduledDate = new Date(value.scheduledAt);
        await scheduleMessage(value.to, value.message, scheduledDate.toISOString());
        toast.success("Message scheduled successfully");
        form.reset();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Message</CardTitle>
        <CardDescription>Schedule a message for future delivery</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-3"
        >
          <form.Field name="to">
            {(field) => (
              <div className="flex flex-col gap-1">
                <Label htmlFor={field.name}>Phone Number</Label>
                <Input
                  id={field.name}
                  placeholder="+1234567890"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <form.Field name="message">
            {(field) => (
              <div className="flex flex-col gap-1">
                <Label htmlFor={field.name}>Message</Label>
                <Input
                  id={field.name}
                  placeholder="Type your message..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <form.Field name="scheduledAt">
            {(field) => (
              <div className="flex flex-col gap-1">
                <Label htmlFor={field.name}>Schedule Date & Time</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  min={minDateTime}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <CalendarIcon className="size-4" />
                )}
                {isSubmitting ? "Scheduling..." : "Schedule"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
