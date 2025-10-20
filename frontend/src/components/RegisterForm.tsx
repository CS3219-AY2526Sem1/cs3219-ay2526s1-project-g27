import { useState } from "react"; 
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext"; 
import { toast } from "sonner"; 

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
    email: z.string().email({ message: "Please enter a valid email." }),
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

      const { error } = await signup({ email, password, name: username });

      if (error) {
        toast.error(`Sign-up failed: ${error.message}`);
      } else {
        toast.success(
          "Sign-up successful! Please check your email (outside of Outlook) to verify your account."
        );
        setIsSuccess(true);
      } 
    } catch (err) {
      console.error("An unexpected error occurred:", err);
      toast.error("An unexpected error occurred. Please try again.");
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
                <FormMessage />
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
                <FormMessage />
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
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button type="submit" className="w-full" disabled={isLoading || isSuccess}>
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