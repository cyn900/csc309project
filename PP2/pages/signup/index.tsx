import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // Import the useTheme hook

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phoneNum, setPhoneNum] = useState<number | undefined>(undefined);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isDarkMode } = useTheme(); // Access the current theme

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!avatar) {
      setError("Please upload an avatar image.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phoneNum", phoneNum?.toString() || "");
    formData.append("avatar", avatar);

    try {
      const response = await fetch("/api/user/signup", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setSuccess(true);
      console.log(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-200px)] ${
      isDarkMode ? "bg-gray-900" : "bg-white"
    }`}>
      <div
        className={`w-full max-w-lg p-6 ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
        } rounded-lg shadow-lg sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl my-8`}
      >
        <h1 className="text-3xl font-bold text-center text-lg sm:text-2xl md:text-3xl">
          Scriptorium
        </h1>
        <p className="text-gray-400 text-center mt-2 text-sm sm:text-base md:text-lg">
          Create Your Account
        </p>
        {error && (
          <div className="mb-4 p-4 text-red-500 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 text-green-500 bg-green-100 rounded-md">
            Signup successful! Redirecting to login...
          </div>
        )}
        <form
          className="mt-6"
          onSubmit={handleSignup}
          encType="multipart/form-data"
        >
          {/* First Name */}
          <div className="mb-4">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-300"
            >
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className={`mt-1 block w-full px-4 py-3 sm:py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              } sm:min-h-[50px] md:min-h-[40px]`}
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-300"
            >
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className={`mt-1 block w-full px-4 py-3 sm:py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              } sm:min-h-[50px] md:min-h-[40px]`}
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="mb-4">
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label
              htmlFor="phoneNum"
              className="block text-sm font-medium text-gray-300"
            >
              Phone Number
            </label>
            <input
              id="phoneNum"
              type="text"
              className={`mt-1 block w-full px-4 py-3 sm:py-2 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-white text-black border-gray-300"
              } sm:min-h-[50px] md:min-h-[40px]`}
              placeholder="Enter your phone number"
              value={phoneNum || ""}
              onChange={(e) => setPhoneNum(Number(e.target.value))}
            />
          </div>

          {/* Avatar Upload */}
          <div className="mb-6">
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-gray-300"
            >
              Avatar Upload
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              onChange={(e) =>
                setAvatar(e.target.files ? e.target.files[0] : null)
              }
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 ${
              isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing up...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
        <p className="text-gray-400 text-center mt-4 text-sm">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-500 hover:underline focus:ring-blue-500"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
