import { NavLink } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';
import QueueTimerDisplay from "../QueueTimerDisplay";
import { Button } from "@/components/ui/button";

// Arrow SVG component
const ArrowIndicator = () => (
  <svg 
    className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-2 text-primary" 
    viewBox="0 0 12 8" 
    fill="currentColor"
  >
    <path d="M6 8L12 0H0L6 8Z" />
  </svg>
);

export default function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const linkClasses = "relative transition-colors hover:text-foreground/80 text-foreground/60";
  const activeLinkClasses = "relative text-foreground font-semibold";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-navbar">
        <div className="container mx-auto flex h-auto items-center justify-between px-4">
          {/* Left: Logo / Header */}
          <div className="flex items-center text-2xl sm:text-3xl lg:text-4xl sm:p-2 md:p-4">
            <NavLink to="/" className="font-pixelify-sans">
              PeerPrep
            </NavLink>
          </div>
          {/* Right: Navigation (only if authenticated) */}
          { isAuthenticated && (
            <div className="flex flex-1 items-center justify-end space-x-6">
              <nav className="flex flex-1 items-center justify-around space-x-6 text-md sm:text-large lg:text-xl">
                <NavLink to="/match" className={({isActive}) => isActive ? activeLinkClasses : linkClasses}>
                  {({isActive}) => (
                    <div className='container font-press-start-2p'>
                      {isActive && <ArrowIndicator />}
                      MATCH!
                    </div>
                  )}
                </NavLink>
                <NavLink to="/" className={({isActive}) => isActive ? activeLinkClasses : linkClasses}>
                  {({isActive}) => (
                    <div className='container'>
                      {isActive && <ArrowIndicator />}
                      Dashboard
                    </div>
                  )}
                </NavLink>
                <NavLink to="/profile" className={({isActive}) => isActive ? activeLinkClasses : linkClasses}>
                  {({isActive}) => (
                    <div className='container'>
                      {isActive && <ArrowIndicator />}
                      Profile
                    </div>
                  )}
                </NavLink>
              </nav>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
      {isAuthenticated && <QueueTimerDisplay />}
    </>
  );
}