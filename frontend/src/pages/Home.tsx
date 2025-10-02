import { type FC, useState } from 'react';
import { Link } from 'react-router-dom';

const Home: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-white text-gray-800 min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <Link to="/">CodeCollab</Link>
          </h1>
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="hover:text-blue-500">Features</Link>
            <Link to="/pricing" className="hover:text-blue-500">Pricing</Link>
            <Link to="/contact" className="hover:text-blue-500">Contact</Link>
          </nav>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-500">Login</Link>
            <Link to="/register" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Register</Link>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-800 focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <nav className="flex flex-col space-y-4">
              <Link to="/features" className="hover:text-blue-500">Features</Link>
              <Link to="/pricing" className="hover:text-blue-500">Pricing</Link>
              <Link to="/contact" className="hover:text-blue-500">Contact</Link>
              <Link to="/login" className="text-gray-600 hover:text-blue-500">Login</Link>
              <Link to="/register" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Register</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-grow text-center py-20 px-4 flex items-center">
        <div className="container mx-auto">
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4">
            Seamless Code Collaboration
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A real-time, intuitive platform designed to streamline your development workflow and enhance team productivity.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register" className="bg-blue-500 text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-blue-600">
              Get Started
            </Link>
            <Link to="/features" className="bg-gray-200 text-gray-800 py-3 px-8 rounded-full text-lg font-semibold hover:bg-gray-300">
              Learn More
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold">Why CodeCollab?</h3>
            <p className="text-gray-600 mt-2">Everything you need in one collaborative workspace.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {/* Feature 1 */}
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="text-4xl text-blue-500 mb-4">⚙️</div>
              <h4 className="text-xl font-semibold mb-2">Real-time Editing</h4>
              <p className="text-gray-600">
                Write and edit code together in real-time. See changes as they happen and avoid merge conflicts.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="text-4xl text-blue-500 mb-4">💬</div>
              <h4 className="text-xl font-semibold mb-2">Integrated Chat & Video</h4>
              <p className="text-gray-600">
                Communicate seamlessly with built-in text, voice, and video chat. Stay in context without switching apps.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 border border-gray-200 rounded-lg">
              <div className="text-4xl text-blue-500 mb-4">🚀</div>
              <h4 className="text-xl font-semibold mb-2">One-click Deployments</h4>
              <p className="text-gray-600">
                Deploy your projects directly from the platform with our streamlined, one-click deployment integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2025 CodeCollab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;