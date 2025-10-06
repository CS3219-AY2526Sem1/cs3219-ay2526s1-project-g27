import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { authClient } from "@/lib/auth-client" // Your auth client import
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL

    try {
      const { data, error } = await authClient.signUp.email(
        {
          name,
          email,
          password,
          callbackURL: frontendUrl, // For email verification redirect
        },
        {
          onSuccess: () => {
            navigate("/", { replace: true })
          },
          onError: (ctx) => {
            // Display error
            alert(`Sign-up failed: ${ctx.error.message}`)
          },
        }
      )
    } catch (err) {
      // This catches errors if the fetch call itself fails (e.g., network down)
      console.error("An unexpected error occurred:", err)
      alert("An unexpected error occurred. Please try again.")
    } finally {
      // 3. Use a 'finally' block to ensure the loading state is always reset.
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Form Section */}
          <form onSubmit={handleSignUp} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your information to get started
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8} // Good practice to add basic client-side validation
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {/* Social Login Buttons */}
                <Button variant="outline" type="button" className="w-full">
                  {/* ... Apple SVG ... */}
                  <span className="sr-only">Sign up with Apple</span>
                </Button>
                <Button variant="outline" type="button" className="w-full">
                   {/* ... Google SVG ... */}
                  <span className="sr-only">Sign up with Google</span>
                </Button>
                <Button variant="outline" type="button" className="w-full">
                   {/* ... Meta SVG ... */}
                  <span className="sr-only">Sign up with Meta</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
          {/* Image Section */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}