import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router-dom";
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

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .max(64, { message: "Password must be at most 64 characters." })
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter." })
      .regex(/[0-9]/, { message: "Must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Common param name is "token" but some flows use "t" or "token" — try both
    const token = searchParams.get("token") ?? null;
    if (!token) {
      form.setError("root", {
        message: "Invalid or missing reset token.",
      });
    }
    setToken(token);
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      form.setError("root", {
        message: "Missing reset token. Please use the link from your email.",
      });
      return;
    }
    setIsLoading(true);
    try {
      form.clearErrors("root"); // Clear previous root errors
      const result = await resetPassword(token, values.password);

      if (result?.error) {
        form.setError("root", {
          message: `Reset failed: ${result.error.message || "Unknown error"}`,
        });
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Reset password failed:", err);
      form.setError("root", {
        message: "An unexpected error occurred. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your new password"
                    required
                    disabled={isLoading || isSuccess}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your new password"
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
              {isLoading ? "Resetting..." : isSuccess ? "Password reset" : "Reset Password"}
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