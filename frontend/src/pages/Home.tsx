import { type FC } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Code, MessageCircle, Users } from 'lucide-react';

const HomePage: FC = () => {
  // Use the auth context for the user's name
  const { user } = useAuth();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-3xl">
        
        {/* App Name & Personalized Welcome */}
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Welcome to PeerPrep
        </h1>
        {user && (
          <p className="mt-4 text-lg">
            Hello, {user.username || user.email}!
          </p>
        )}

        {/* Tagline */}
        <p className="mt-6 text-xl leading-8">
          Peerprep offers a seamless way to prepare for live coding interviews. Connect with
          peers, solve problems, and land your dream job—together.
        </p>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navbar">
              <Users className="h-6 w-6 text-black" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">Peer Matching</h3>
            <p className="mt-2 text-sm">
              Find the perfect partner at your skill level.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navbar">
              <Code className="h-6 w-6 text-black" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">Multi-Language Support</h3>
            <p className="mt-2 text-sm">
              Practice in JavaScript, Python, Java, C++, and more.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navbar">
              <MessageCircle className="h-6 w-6 text-black" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">Live Chat & Editors</h3>
            <p className="mt-2 text-sm">
              Collaborate in real-time with integrated chat.
            </p>
          </div>
        </div>

        {/* Call to Action & Logout */}
        <p className="mt-12 text-xl leading-8">
          Click 'Match' above to start matching!
        </p>
      </div>
    </div>
  );
};

export default HomePage;