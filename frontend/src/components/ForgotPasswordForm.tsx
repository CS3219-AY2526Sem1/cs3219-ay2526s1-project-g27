import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email." }),
});

export default function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      form.clearErrors("root"); // Clear previous root errors
      // Redirect to ResetPassword page after user clicks email link
      const redirectTo = `${window.location.origin}/reset-password`;
      const result = await requestPasswordReset(values.email, redirectTo);

      if (result?.error) {
        form.setError("root", {
          message: `Failed to request password reset: ${result.error.message || "Unknown error"}`,
        });
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      form.setError("root", {
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false); // Re-enable the form
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    required
                    disabled={isLoading || isSuccess}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600" />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <FormItem>
              <FormMessage className="text-red-600">{form.formState.errors.root.message}</FormMessage>
            </FormItem>
          )}

          <Field>
            <Button type="submit" className="bg-navbar w-full" disabled={isLoading || isSuccess}>
              {isLoading ? "Sending..." : isSuccess ? "Check your email" : "Send reset link"}
            </Button>

            <FieldDescription className="text-center">
              Remembered your password? <a href="/login">Log in</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}