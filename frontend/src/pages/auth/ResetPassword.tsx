import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
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
        <Card>
          <CardHeader>
            <CardTitle className="font-bold text-large">Set a new password</CardTitle>
            <CardDescription>Use the link from your email to choose a new password</CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}