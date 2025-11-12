/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5)
Scope: 
- Generated initial boiler plate UI
- Debugging 
Author review: 
- Verfied for correctness by reading code
- Tested using local 
*/


import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const { isAuthenticated } = useAuth(); 
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true }); 
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div className="text-2xl font-bold">Pre-<i>pair</i> for your coding interviews. Together.</div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-large">Login to your account</CardTitle>
            <CardDescription>Enter your email and password below</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}