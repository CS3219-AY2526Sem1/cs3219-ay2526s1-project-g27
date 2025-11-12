/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Pro date: 2025‑10‑07
Scope: 
- Introduced Zod validation schema integration
Author review: 
- Rewrote code around the custom requirements of users' particulars
(e.g. minimum/maximum password length, valid email regex format)
- Verified by testing code
*/

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

const formSchema = z
  .object({
    username: z
      .string()
      .min(2, { message: "Username must be at least 2 characters." }),
    email: z.email({ message: "Please enter a valid email." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }) 
      .max(20, { message: "Password must be at most 20 characters." })
      // Enforce character variety using regular expressions
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter." })
      .regex(/[0-9]/, { message: "Must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  // Add a new refine check to disallow username in password
  .refine((data) => !data.password.includes(data.username), {
    message: "Password cannot contain your username.",
    path: ["password"],
  });

export default function RegisterForm() {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { email, password, username } = values;
      form.clearErrors("root"); // Clear previous root errors
      const { error } = await signup({ email, password, name: username });

      if (error) {
        form.setError("root", { message: `Sign-up failed: ${error.message}` });
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("An unexpected error occurred:", err);
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="yourusername"
                    required
                    disabled={isLoading || isSuccess}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600"/>
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    required
                    disabled={isLoading || isSuccess}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600"/>
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your password"
                    required
                    disabled={isLoading || isSuccess}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600"/>
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    required
                    disabled={isLoading || isSuccess}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-600"/>
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
              {
                isLoading
                ? "Signing Up..."
                : isSuccess
                ? "Success! Check your email"
                : "Sign Up"
              }
            </Button>
            <FieldDescription className="text-center">
              Already have an account? <a href="/login">Log in</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  );
}