import { useRouter } from "next/router";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNum?: string;
  avatar?: string;
}

const Profile = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNum: "",
    avatar: null as File | null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await axios.get("/api/user/profile", {
        headers: {
          Authorization: token || "",
        },
      });
      
      if (response.data.user) {
        setProfile(response.data.user);
        setFormData({
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          phoneNum: response.data.user.phoneNum?.toString() || "",
          avatar: null,
        });
      }
    } catch (error) {
      setMessage("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    
    const formDataToSend = new FormData();
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("phoneNum", formData.phoneNum);
    if (formData.avatar) {
      formDataToSend.append("avatar", formData.avatar);
    }

    try {
      const response = await axios.patch("/api/user/profile", formDataToSend, {
        headers: {
          Authorization: token || "",
        },
      });
      setMessage("Profile updated successfully!");
      fetchProfile();
    } catch (error) {
      setMessage("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="w-8 h-8 rounded-full bg-gray-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        
        <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="mb-8 flex justify-center">
            <div className="relative w-32 h-32">
              <Image
                src={preview || (profile?.avatar ? profile.avatar.replace("public/", "/") : "/avatar/default.jpg")}
                alt="Profile"
                fill
                className="rounded-full object-cover border-4 border-blue-500"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`w-full p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                  } border border-gray-300`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`w-full p-3 rounded-lg ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                  } border border-gray-300`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNum}
                onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })}
                className={`w-full p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                } border border-gray-300`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={`w-full p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-black"
                } border border-gray-300`}
              />
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes("Failed") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;