import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { useCode } from "../../context/CodeContext";

const TemplateDetails: React.FC = () => {
  const router = useRouter();
  const { tID } = router.query;
  const [template, setTemplate] = useState<any>(null);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState<any>({});
  const { isDarkMode } = useTheme();
  const { setCode } = useCode(); // Use the CodeContext to store code

  useEffect(() => {
    const fetchTemplateAndUser = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        // Fetch current user information if logged in
        if (token) {
          const userResponse = await axios.get("/api/user/me", {
            headers: { Authorization: token },
          });
          const userID = userResponse.data.user.uID;
          setCurrentUserID(userID);
        }

        // Fetch the template details
        const response = await axios.get(`/api/templates/?tID=${tID}`);
        const templateData = response.data;
        setTemplate(templateData);
        setEditedTemplate(templateData);

        // Check if the current user is the owner
        if (currentUserID && templateData.user) {
          setIsOwner(currentUserID === templateData.user.uID);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/blogs");
      }
    };

    if (tID) fetchTemplateAndUser();
  }, [tID, router, currentUserID]);

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("You must be logged in to save changes.");
        router.push("/login");
        return;
      }

      const updatedData = {
        tID: parseInt(tID as string, 10), // Convert tID to a number
        title: editedTemplate.title,
        explanation: editedTemplate.explanation,
        code: editedTemplate.code,
        fork: editedTemplate.fork || false, // Ensure `fork` is included
        tags: editedTemplate.tags.map((tag: { value: string }) => tag.value), // Extract tag values
      };

      await axios.patch(`/api/templates`, updatedData, {
        headers: { Authorization: token },
      });

      alert("Template updated successfully.");
      setTemplate(editedTemplate);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("An error occurred while saving the changes.");
    }
  };

  const handleFork = () => {
    if (template) {
      const confirm = window.confirm(
        `Are you sure you want to fork and edit the template "${template.title}"?`
      );

      if (confirm) {
        // Save the forked code to the CodeContext
        setCode(template.code);

        // Redirect to the code execution page
        router.push("/code");
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
        <h1 className="text-3xl font-bold">
          {isEditing ? (
            <input
              type="text"
              value={editedTemplate.title}
              onChange={(e) =>
                setEditedTemplate({ ...editedTemplate, title: e.target.value })
              }
              className={`px-3 py-2 rounded-lg w-full ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
              }`}
            />
          ) : (
            template.title
          )}
        </h1>
        <div className="flex gap-4">
          {isOwner && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className={`px-6 py-2 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? "bg-yellow-500 text-white hover:bg-yellow-400"
                  : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
              }`}
            >
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleSaveChanges}
                className={`px-6 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode
                    ? "bg-green-500 text-white hover:bg-green-400"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTemplate(template);
                }}
                className={`px-6 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode
                    ? "bg-gray-600 text-white hover:bg-gray-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={handleFork}
            className={`px-6 py-2 rounded-lg text-sm font-medium ${
              isDarkMode
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
            }`}
          >
            Fork Template
          </button>
        </div>
      </div>
      <div className="mt-4">
        <p>
          {isEditing ? (
            <textarea
              value={editedTemplate.explanation}
              onChange={(e) =>
                setEditedTemplate({
                  ...editedTemplate,
                  explanation: e.target.value,
                })
              }
              className={`w-full p-3 rounded-lg ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
              }`}
              rows={5}
            />
          ) : (
            template.explanation
          )}
        </p>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Tags:</h2>
        <div className="flex gap-2 mt-2">
          {isEditing ? (
            <input
              type="text"
              value={editedTemplate.tags.map((tag) => tag.value).join(", ")}
              onChange={(e) =>
                setEditedTemplate({
                  ...editedTemplate,
                  tags: e.target.value.split(",").map((value) => ({
                    id: Math.random().toString(),
                    value: value.trim(),
                  })),
                })
              }
              className={`w-full px-3 py-2 rounded-lg ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
              }`}
            />
          ) : (
            template.tags.map((tag) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDetails;
