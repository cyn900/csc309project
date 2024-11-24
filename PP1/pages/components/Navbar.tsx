import { useTheme } from "../../context/ThemeContext";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "?";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("accessToken");
    const storedUserData = localStorage.getItem("userData");

    console.log("Checking auth with token:", token);
    console.log("Stored user data:", storedUserData);

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // First try to use stored user data
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        setIsLoading(false);
      } catch (e) {
        console.error("Failed to parse stored user data");
      }
    }

    // Then verify with server
    try {
      const response = await axios.get("/api/user/profile", {
        headers: {
          Authorization: token, // token already includes 'Bearer '
        },
      });

      if (response.data.user) {
        setUser(response.data.user);
        localStorage.setItem("userData", JSON.stringify(response.data.user));
      } else {
        console.error("Invalid user data in response");
        setUser(null);
        localStorage.removeItem("userData");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleUserLogin = (event: CustomEvent) => {
      console.log("Login event received with data:", event.detail);
      if (event.detail) {
        setUser(event.detail);
      }
      checkAuth();
    };

    const checkAuthStatus = async () => {
      await checkAuth();
    };

    checkAuthStatus();

    window.addEventListener("userLoggedIn", handleUserLogin as EventListener);

    return () => {
      window.removeEventListener(
        "userLoggedIn",
        handleUserLogin as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    setUser(null);
    setIsProfileOpen(false);

    const event = new CustomEvent("userLoggedIn", { detail: null });
    window.dispatchEvent(event);

    window.location.href = "/login";
  };

  const renderAuthSection = () => {
    if (isLoading) {
      return <div className="w-8 h-8 rounded-full bg-gray-500 animate-pulse" />;
    }

    if (user && user.firstName && user.lastName) {
      return (
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            {user.avatar ? (
              <img
                src={user.avatar.replace("public/", "")}
                alt={`${user.firstName}'s avatar`}
                className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium border-2 border-blue-400">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            <span className="hidden sm:block">{user.firstName}</span>
          </button>

          {isProfileOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${
                isDarkMode ? "bg-gray-700" : "bg-white"
              }`}
            >
              <div
                className={`px-4 py-2 border-b ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar.replace("public/", "")}
                      alt={`${user.firstName}'s avatar`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium border-2 border-blue-400">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {`${user.firstName} ${user.lastName}`}
                    </p>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      } truncate`}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/profile">
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    isDarkMode
                      ? "text-white hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Profile Settings
                </button>
              </Link>
              <Link href="/my-blogs">
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    isDarkMode
                      ? "text-white hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Blogs
                </button>
              </Link>
              <Link href="/my-templates">
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${
                    isDarkMode
                      ? "text-white hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Templates
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className={`block px-4 py-2 text-sm w-full text-left ${
                  isDarkMode
                    ? "text-red-400 hover:bg-gray-600"
                    : "text-red-600 hover:bg-gray-100"
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
    <nav
      className={`p-4 ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="text-xl">
          <Link href="/">
            <h2 className="hover:underline">Scriptorium</h2>
          </Link>
        </div>

        <div className="sm:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`text-white focus:outline-none ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>

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

      {isMenuOpen && (
        <div
          className={`sm:hidden flex flex-col space-y-4 mt-4 p-4 rounded-lg ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
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
