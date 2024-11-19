import React from "react";
import { useTheme } from "../context/ThemeContext"; // Import the ThemeContext
import Link from "next/link";

const ScriptoriumLandingPage: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme(); // Access dark mode state and toggle function

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
      } flex flex-col`}
    >
      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center p-10">
        <h1 className="text-4xl font-bold mb-4">Welcome to Scriptorium</h1>
        <p className="max-w-lg">
          Explore, write, and execute code with ease. Share your knowledge and
          discover new ideas on our blog. Start your coding journey with our
          ready-to-use templates.
        </p>
        <div className="mt-6 space-x-4">
          <Link href="/code" passHref>
            <h2 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-center">
              Try Now
            </h2>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-10">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">Features of Scriptorium</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-lg shadow ${
                isDarkMode
                  ? "bg-gray-800 text-white"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              <h3 className="text-lg font-bold mb-2">Code Runner</h3>
              <p>
                Execute your code in real-time with support for multiple
                languages.
              </p>
            </div>
            <div
              className={`p-6 rounded-lg shadow ${
                isDarkMode
                  ? "bg-gray-800 text-white"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              <h3 className="text-lg font-bold mb-2">Blog</h3>
              <p>
                Share insights, tutorials, and updates with the coding
                community.
              </p>
            </div>
            <div
              className={`p-6 rounded-lg shadow ${
                isDarkMode
                  ? "bg-gray-800 text-white"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              <h3 className="text-lg font-bold mb-2">Code Templates</h3>
              <p>
                Access a library of templates to speed up your development
                process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section id="cta" className="py-10">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="max-w-md mx-auto">
            Join Scriptorium and take your coding skills to the next level.
            Whether you're a beginner or an expert, we have something for you.
          </p>
          <Link href="/login" passHref>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
              Login
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`p-6 ${
          isDarkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-600"
        } shadow-sm`}
      >
        <div className="container mx-auto text-center">
          © 2024 Scriptorium. All rights reserved by William Lam and Cynthia
          Zhou.
        </div>
      </footer>
    </div>
  );
};

export default ScriptoriumLandingPage;
