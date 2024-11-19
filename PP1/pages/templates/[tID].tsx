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
      <h1 className="text-3xl font-bold">{template.title}</h1>
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
