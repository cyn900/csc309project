import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import Link from 'next/link';
import { MdOutlineContacts } from "react-icons/md";

const Footer: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-800 to-gray-900 text-gray-300 border-t border-gray-700' 
        : 'bg-gradient-to-b from-gray-50 to-white text-gray-600 border-t border-gray-200'
    } shadow-sm`}>
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4">About Scriptorium</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              A platform for developers to code, learn, and share knowledge together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/blogs" 
                  className={`hover:text-blue-500 transition duration-200 ${
                    isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600'
                  }`}
                >
                  Blogs
                </Link>
              </li>
              <li>
                <Link 
                  href="/templates" 
                  className={`hover:text-blue-500 transition duration-200 ${
                    isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600'
                  }`}
                >
                  Templates
                </Link>
              </li>
              <li>
                <Link 
                  href="/code" 
                  className={`hover:text-blue-500 transition duration-200 ${
                    isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600'
                  }`}
                >
                  Code Runner
                </Link>
              </li>
            </ul>
          </div>

          {/* more info */}
          <div>
            <h3 className="font-bold text-lg mb-4">More Information</h3>
            <div className="flex space-x-4">
              <a 
                href="https://www.cs.toronto.edu/~kianoosh/courses/csc309/resources/handouts/?source=pp2" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`hover:text-blue-500 transition duration-200 ${
                  isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600'
                }`}
              >
                <MdOutlineContacts size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        } mt-4 pt-2 text-center text-sm`}>
          <p className="mb-4">Built with ❤️ for developers worldwide</p>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            © 2024 Scriptorium. All rights reserved by William Lam and Cynthia Zhou.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 