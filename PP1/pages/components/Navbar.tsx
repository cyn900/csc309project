import { useTheme } from "../../contexts/ThemeContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from 'axios';

interface User {
  firstName: string;
  lastName: string;
  email: string;
}

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth on mount and when localStorage changes
  useEffect(() => {
    checkAuth();

    // Add event listener for storage changes
    window.addEventListener('storage', checkAuth);
    
    // Custom event listener for login
    window.addEventListener('login', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('login', checkAuth);
    };
  }, []);

  // Add this to recheck auth when token changes
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) {
      checkAuth();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsProfileOpen(false);
    
    // Dispatch logout event
    const logoutEvent = new Event('userLogin');
    window.dispatchEvent(logoutEvent);
    
    window.location.href = '/login';
  };

  // User profile/login section
  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="w-8 h-8 rounded-full bg-gray-500 animate-pulse" />
      );
    }

    if (user) {
      return (
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user.firstName}
            </div>
            <span className="hidden sm:block">{user.firstName}</span>
          </button>

          {isProfileOpen && (
            <div 
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
                isDarkMode ? "bg-gray-700" : "bg-white"
              }`}
            >
              <Link href="/profile">
                <button className={`block px-4 py-2 text-sm w-full text-left ${
                  isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                }`}>
                  Profile
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className={`block px-4 py-2 text-sm w-full text-left ${
                  isDarkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-100 text-red-600"
                }`}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <Link href="/login">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Login
        </button>
      </Link>
    );
  };

  return (
    <nav className={`p-4 ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
      <div className="flex justify-between items-center">
        <div className="text-xl">Scriptorium</div>

        {/* Hamburger icon for mobile */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`text-white focus:outline-none ${isDarkMode ? "text-white" : "text-black"}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-4">
          <Link href="/blogs">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Blogs
            </button>
          </Link>
          <Link href="/templates">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Code Templates
            </button>
          </Link>
          <Link href="/code">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Code Execution
            </button>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-white"
            }`}
          >
            {isDarkMode ? "Light" : "Dark"}
          </button>

          {renderAuthSection()}
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className={`sm:hidden flex flex-col space-y-4 mt-4 p-4 rounded-lg ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}>
          <Link href="/blogs">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-600 w-full text-left">
              Blogs
            </button>
          </Link>
          <Link href="/templates">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-600 w-full text-left">
              Code Templates
            </button>
          </Link>
          <Link href="/code">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-600 w-full text-left">
              Code Execution
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
