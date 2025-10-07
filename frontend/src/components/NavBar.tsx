import { NavLink } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';

// Arrow SVG component
const ArrowIndicator = () => (
  <svg 
    className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-2 text-primary" 
    viewBox="0 0 12 8" 
    fill="currentColor"
  >
    <path d="M6 0L12 8H0L6 0Z" />
  </svg>
);

export default function NavBar() {
  const { isAuthenticated } = useAuth();
  const linkClasses = "relative transition-colors hover:text-foreground/80 text-foreground/60";
  const activeLinkClasses = "relative text-foreground font-semibold";

  return (
    <header className="sticky top-0 w-full border-b border-gray-200 bg-navbar">
      <div className="container mx-auto flex-auto h-auto items-center justify-between px-4">
        {/* Left: Logo / Header */}
        <div className="flex items-center text-2xl sm:text-3xl lg:text-4xl sm:p-2 md:p-4">
          <NavLink to="/" className="font-pixelify-sans">
            PeerPrep
          </NavLink>
        </div>
        {/* Right: Navigation (only if authenticated) */}
        { isAuthenticated && (
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <NavLink to="/match" className={({isActive}) => isActive ? activeLinkClasses : linkClasses}>
              {({isActive}) => (
                <>
                  {isActive && <ArrowIndicator />}
                  MATCH
                </>
              )}
            </NavLink>
            <NavLink to="/" className={({isActive}) => isActive ? activeLinkClasses : linkClasses}>
              {({isActive}) => (
                <>
                  {isActive && <ArrowIndicator />}
                  Dashboard
                </>
              )}
            </NavLink>
            <NavLink to="/profile" className={({isActive}) => isActive ? activeLinkClasses : linkClasses}>
              {({isActive}) => (
                <>
                  {isActive && <ArrowIndicator />}
                  Profile
                </>
              )}
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}