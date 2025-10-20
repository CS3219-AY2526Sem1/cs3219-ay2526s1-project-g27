import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"


const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." })
                      .max(20, { message: "Password must be at most 20 characters." }),
})

export default function LoginForm() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true }); 
    }
  }, [isAuthenticated, navigate]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await login(values); // login({ email, password })
    } catch (error) {
      alert(`Login has failed + ${error}`)
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
                <div className="flex items-center">
                  <FormLabel>Email</FormLabel>
                </div>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="m@example.com"
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel>Password</FormLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your password here"
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button type="submit" disabled={isLoading} className="bg-navbar w-full">
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            <FieldDescription className="text-center">
              Don&apos;t have an account? <a href="/register">Sign up</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  )
}
