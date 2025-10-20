import { type FC } from 'react';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";

const ProfilePage: FC = () => {
  const { user } = useAuth();

  // Helper to get user initials for the avatar
  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-12">
        {/* Profile Details Section */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl font-semibold text-gray-500">
                {getInitials(user!.username || 'User')}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-white shadow-md">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">{user!.username}</h1>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-500">{user!.email}</p>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-500 tracking-widest">**********</p>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* User Statistics Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">User Statistics</h2>
          <div className="text-gray-600 space-y-2">
            {/* Note: This data is hardcoded as it's not in the AuthContext */}
            <p>Last logged in: Tuesday 8:58pm</p>
            <p>Questions completed: 609</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;