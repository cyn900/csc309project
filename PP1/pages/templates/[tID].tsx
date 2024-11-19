import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";

const TemplateDetails: React.FC = () => {
  const router = useRouter();
  const { tID } = router.query;
  const [template, setTemplate] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (tID) {
      const fetchTemplate = async () => {
        try {
          const response = await axios.get(`/api/templates/?tID=${tID}`);
          setTemplate(response.data);
        } catch (error) {
          console.error("Failed to fetch template details:", error);
        }
      };
      fetchTemplate();
    }
  }, [tID]);

  const handleFork = async () => {
    if (template) {
      const confirm = window.confirm(
        `Are you sure you want to fork and edit the template "${template.title}"?`
      );

      if (confirm) {
        try {
          // Make a POST request to create a new forked template

          const token = localStorage.getItem("accessToken");

          const response = await axios.post(
            "/api/templates", // API endpoint
            {
              title: `Fork of ${template.title}`, // Title of the new fork
              explanation: template.explanation, // Explanation from the original template
              tags: template.tags.map((tag) => tag.value), // Array of tag values
              code: template.code, // Code from the original template
              fork: true, // Set fork attribute to true
            },
            {
              headers: {
                Authorization: `${token}`, // Include the token in the Authorization header
              },
            }
          );

          // Redirect to the code execution page with only the code segment
          router.push({
            pathname: "/code-execution",
            query: { code: template.code },
          });
        } catch (error) {
          console.error("Failed to fork the template:", error);
          alert(
            "An error occurred while forking the template. Please try again."
          );
        }
      }
    }
  };

  if (!template) {
    return (
      <div
        className={`p-8 min-h-screen ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
        }`}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`p-8 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <button
          onClick={handleFork}
          className={`px-6 py-2 rounded-lg text-sm font-medium ${
            isDarkMode
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-blue-100 text-blue-600 hover:bg-blue-200"
          }`}
        >
          Fork and Edit
        </button>
      </div>
      <p className="mt-4">{template.explanation}</p>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Code:</h2>
        <pre
          className={`p-4 rounded-lg mt-2 ${
            isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
          }`}
        >
          <code>{template.code}</code>
        </pre>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Tags:</h2>
        <div className="flex gap-2 mt-2">
          {template.tags.map((tag) => (
            <span
              key={tag.id}
              className={`text-sm px-3 py-1 rounded-full ${
                isDarkMode
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {tag.value}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Created By:</h2>
        <p className="mt-2">
          {template.user.firstName} {template.user.lastName} (
          {template.user.email})
        </p>
      </div>
    </div>
  );
};

export default TemplateDetails;
