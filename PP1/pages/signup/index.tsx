import React, { useState } from "react";

const Signup: React.FC = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [phoneNum, setPhoneNum] = useState<number | undefined>(undefined);
  const [avatar, setAvatar] = useState<File | null>(null);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!avatar) {
      alert("Please upload an avatar image.");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phoneNum", phoneNum?.toString() || "");
    formData.append("avatar", avatar);

    // Submit formData to your API endpoint
    fetch("/api/user/signup", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          alert("Signup successful!");
          console.log(data);
        }
      })
      .catch((err) => {
        console.error("Signup error:", err);
      });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl">
        <h1 className="text-3xl font-bold text-white text-center text-lg sm:text-2xl md:text-3xl">
          Scriptorium
        </h1>
        <p className="text-gray-400 text-center mt-2 text-sm sm:text-base md:text-lg">
          Create Your Account
        </p>
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
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign Up
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
