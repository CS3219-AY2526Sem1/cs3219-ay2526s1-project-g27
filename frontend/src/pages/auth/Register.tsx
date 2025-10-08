import RegisterForm from "@/components/signup-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function RegisterPage() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-large">Register a new account</CardTitle>
            <CardDescription>Set your account details below</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}