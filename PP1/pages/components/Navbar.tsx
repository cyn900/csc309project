import { useTheme } from "../../contexts/ThemeContext"; // Import the useTheme hook
import Link from "next/link"; // To handle navigation using Next.js Link component
import { useState } from "react"; // To handle the hamburger menu toggle

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme(); // Get theme state and toggle function
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control the hamburger menu

  // Toggle the menu visibility
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav
      className={`p-4 ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="text-xl">Scriptorium</div>

        {/* Hamburger icon for mobile */}
        <div className="sm:hidden">
          <button
            onClick={toggleMenu}
            className={`text-white focus:outline-none ${
              isDarkMode ? "text-white" : "text-black"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
        </div>

        {/* Navbar Links for desktop */}
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

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`px-4 py-2 rounded-lg ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
      </div>

      {/* Mobile menu - hamburger dropdown */}
      {isMenuOpen && (
        <div
          className={`sm:hidden flex flex-col space-y-4 mt-4 p-4 rounded-lg ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          <Link href="/blogs">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-600">
              Blogs
            </button>
          </Link>
          <Link href="/templates">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-600">
              Code Templates
            </button>
          </Link>
          <Link href="/code">
            <button className="px-4 py-2 rounded-lg hover:bg-gray-600">
              Code Execution
            </button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
