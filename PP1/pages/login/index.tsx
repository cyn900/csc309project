import React, { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext"; // Import the useTheme hook
import { useRouter } from 'next/router';
import axios from 'axios';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const { isDarkMode, toggleTheme } = useTheme(); // Access the current theme and toggle function

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/user/login', { email, password });
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = response.data.accessToken;
      
      // Dispatch custom event to notify Navbar
      window.dispatchEvent(new Event('login'));
      
      // Redirect to home or dashboard
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error (you might want to show an error message to the user)
    }
  };

  return (
    <div
      className={`flex h-screen items-center justify-center ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div
        className={`w-full max-w-lg p-6 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
        } rounded-lg shadow-lg sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl`}
      >
        <h1 className="text-3xl font-bold text-center text-lg sm:text-2xl md:text-3xl">
          Scriptorium
        </h1>
        <p className="text-gray-400 text-center mt-2 text-sm sm:text-base md:text-lg">
          Code. Execute. Innovate.
        </p>
        <form className="mt-6" onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`mt-1 block w-full px-4 py-3 sm:py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              } sm:min-h-[50px] md:min-h-[40px]`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={`mt-1 block w-full px-4 py-3 sm:py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              } sm:min-h-[50px] md:min-h-[40px]`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
        <p className="text-gray-400 text-center mt-4 text-sm">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-blue-500 hover:underline focus:ring-blue-500"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
