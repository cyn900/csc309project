import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { useCode } from "../../context/CodeContext";
import { FaArrowLeft, FaEdit, FaTrash, FaCode } from "react-icons/fa";
import Link from "next/link";

const TemplateDetails: React.FC = () => {
  const router = useRouter();
  const { tID } = router.query;
  const [template, setTemplate] = useState<any>(null);
  const [currentUserID, setCurrentUserID] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
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
          const user = userResponse.data.user;
          setCurrentUserID(user.uID);
          setCurrentUserRole(user.role);
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

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the template "${template.title}"? This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("You must be logged in to delete templates.");
          router.push("/login");
          return;
        }

        const tIDNumber = parseInt(tID as string, 10); // Ensure tID is a number
        if (isNaN(tIDNumber)) {
          alert("Invalid template ID.");
          return;
        }

        await axios.delete(`/api/templates`, {
          headers: { Authorization: token },
          params: { tID: tIDNumber }, // Pass tID as a query parameter
        });

        alert("Template deleted successfully.");
        router.push("/templates"); // Redirect after successful deletion
      } catch (error: any) {
        console.error("Failed to delete template:", error);

        // Handle different error statuses
        if (error.response) {
          const { status, data } = error.response;

          if (status === 400) {
            alert(data.error || "Invalid request.");
          } else if (status === 401) {
            alert(
              data.error || "You must be logged in to delete this template."
            );
            router.push("/login");
          } else if (status === 403) {
            alert(
              data.error || "You are not authorized to delete this template."
            );
          } else if (status === 404) {
            alert(data.error || "Template not found.");
          } else {
            alert("An error occurred while deleting the template.");
          }
        } else {
          alert("An unexpected error occurred.");
        }
      }
    }
  };

  const handleFork = async () => {
    if (template) {
      const confirm = window.confirm(
        `Are you sure you want to fork and edit the template "${template.title}"?`
      );

      if (confirm) {
        const token = localStorage.getItem("accessToken");
        if (token) {
          try {
            const now = new Date();
            const forkedTemplateData = {
              title: `Fork of ${template.title} at ${now.toISOString()}`,
              explanation: template.explanation,
              code: template.code,
              fork: true,
              tags: template.tags.map((tag: { value: string }) => tag.value),
            };

            const response = await axios.post(`/api/templates`, forkedTemplateData, {
              headers: { Authorization: token },
            });

            alert("Template forked successfully!");
            const newTemplateId = response.data.template.tID;
          await router.push(`/templates/${newTemplateId}`);
          } catch (error) {
            console.error("Failed to save forked template:", error);
            alert("An error occurred while saving the forked template.");
          }
        } else {
          alert("Failed to save code template. User needs to log in.");
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
    <div className={`p-8 min-h-screen ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>
      {/* Header Section */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {isEditing ? (
              <input
                type="text"
                value={editedTemplate.title}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, title: e.target.value })}
                className={`px-4 py-2 rounded-lg w-full border ${
                  isDarkMode 
                    ? "bg-gray-800 text-white border-gray-700" 
                    : "bg-white text-black border-gray-300"
                }`}
              />
            ) : (
              template.title
            )}
          </h1>
          <div className="flex gap-3">
            {isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-blue-400" 
                    : "text-gray-600 hover:bg-gray-200 hover:text-blue-600"
                }`}
              >
                <FaEdit />
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTemplate(template);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  isDarkMode 
                    ? "text-gray-400 hover:bg-gray-700 hover:text-red-400" 
                    : "text-gray-600 hover:bg-gray-200 hover:text-red-600"
                }`}
              >
                <FaTrash />
              </button>
            )}
            <button
              onClick={handleFork}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              {localStorage.getItem("accessToken") ? "Fork Template" : "Fork"}
            </button>
            
          </div>
        </div>

        {/* Main Content */}
        <div className={`rounded-lg p-6 mb-6 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } shadow-sm`}>
          {/* Author Info */}
          <div className="mb-6 flex items-center gap-3">
            <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              Created by{" "}
              <span className="font-medium">
                {template.user.firstName} {template.user.lastName}
              </span>
            </div>
            {template.fork && (
              <span className={`text-sm px-2 py-1 rounded ${
                isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
              }`}>
                Forked Template
              </span>
            )}
          </div>

          {/* Explanation */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Explanation</h2>
            {isEditing ? (
              <textarea
                value={editedTemplate.explanation}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, explanation: e.target.value })}
                className={`w-full p-4 rounded-lg border ${
                  isDarkMode 
                    ? "bg-gray-700 text-white border-gray-600" 
                    : "bg-gray-50 text-black border-gray-300"
                }`}
                rows={5}
              />
            ) : (
              <p className={`p-4 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-gray-50"
              }`}>
                {template.explanation}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTemplate.tags.map((tag: { value: string }) => tag.value).join(", ")}
                  onChange={(e) =>
                    setEditedTemplate({
                      ...editedTemplate,
                      tags: e.target.value.split(",").map((value: string) => ({
                        id: Math.random().toString(),
                        value: value.trim(),
                      })),
                    })
                  }
                  placeholder="Enter tags separated by commas"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? "bg-gray-700 text-white border-gray-600" 
                      : "bg-gray-50 text-black border-gray-300"
                  }`}
                />
              ) : (
                template.tags.map((tag: { id: string; value: string }) => (
                  <span
                    key={tag.id}
                    className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
                  >
                    {tag.value}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Code Section */}
        <div className={`rounded-lg p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">Code</h2>
            <Link
              href={`/code?tID=${template.tID}`}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode 
                  ? "text-gray-400 hover:bg-gray-700 hover:text-green-400" 
                  : "text-gray-600 hover:bg-gray-200 hover:text-green-600"
              }`}
              title="Try code"
            >
              <FaCode />
            </Link>
          </div>
          {isEditing ? (
            <textarea
              value={editedTemplate.code}
              onChange={(e) => setEditedTemplate({ ...editedTemplate, code: e.target.value })}
              className={`w-full p-4 rounded-lg border font-mono ${
                isDarkMode 
                  ? "bg-gray-700 text-white border-gray-600" 
                  : "bg-gray-50 text-black border-gray-300"
              }`}
              rows={10}
            />
          ) : (
            <pre className={`p-4 rounded-lg overflow-x-auto font-mono ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}>
              <code>{template.code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDetails;
