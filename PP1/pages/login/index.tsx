import React, { useState } from "react";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log({ email, password });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl">
        <h1 className="text-3xl font-bold text-white text-center text-lg sm:text-2xl md:text-3xl">
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
              className="mt-1 block w-full px-4 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 sm:min-h-[50px] md:min-h-[40px]"
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
              className="mt-1 block w-full px-4 py-3 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500 sm:min-h-[50px] md:min-h-[40px]"
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
