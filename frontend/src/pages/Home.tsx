import { type FC } from 'react';
import { useAuth } from '@/context/AuthContext'
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";




const HomePage: FC = () => {
  const { user, jwt, logout } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center mb-2">User Dashboard (Debug)</h1>
          <p className="text-center text-gray-500 text-sm">
            This page displays your user session details.
          </p>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">User ID:</span>
              <span className="text-gray-600">{user!.id}</span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="text-gray-600">{user!.email}</span>
            </div>

            {user!.username && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Username:</span>
                <span className="text-gray-600">{user!.username}</span>
              </div>
            )}

            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">Authenticated:</span>
              <span className="text-green-600 font-medium">Yes ✅</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">Json Web Token:</span>
              <span className="text-green-600 font-medium">{jwt}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pt-4">
          <Button
            variant="destructive"
            onClick={logout}
            className="w-full"
          >
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HomePage;