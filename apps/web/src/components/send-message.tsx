import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@watsify/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@watsify/ui/components/card";
import { Input } from "@watsify/ui/components/input";
import { Label } from "@watsify/ui/components/label";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/lib/whatsapp";

const schema = z.object({
  to: z.string().min(1, "Phone number is required"),
  message: z.string().min(1, "Message is required"),
});

export default function SendMessage() {
  const form = useForm({
    defaultValues: { to: "", message: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        await sendMessage(value.to, value.message);
        toast.success("Message sent successfully");
        form.reset();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
        <CardDescription>Send an instant WhatsApp message</CardDescription>
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
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
