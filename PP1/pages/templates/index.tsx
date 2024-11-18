import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";

interface Template {
  tID: number;
  title: string;
  explanation: string;
  tags: { id: number; value: string }[];
  code: string;
  fork: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
}

interface Tag {
  value: string;
}

interface MetaData {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

const CodeTemplateSearch: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [metaData, setMetaData] = useState<MetaData>({
    totalItems: 0,
    currentPage: 1,
    pageSize: 5,
    totalPages: 1,
  });
  const [showFilters, setShowFilters] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [searchParams, setSearchParams] = useState({
    title: "",
    explanation: "",
    tags: [] as string[],
    forkedOnly: false,
  });

  // Fetch templates based on search parameters and current page
  useEffect(() => {
    const fetchTemplates = async () => {
      const queryParams = new URLSearchParams({
        title: searchParams.title,
        explanation: searchParams.explanation,
        forkedOnly: searchParams.forkedOnly.toString(),
        tags: searchParams.tags.join(","),
        page: metaData.currentPage.toString(),
        pageSize: metaData.pageSize.toString(),
      });

      try {
        const response = await axios.get(
          `/api/templates?${queryParams.toString()}`
        );
        const { data, meta } = response.data;
        setTemplates(data); // Use `data` from the response
        setMetaData(meta); // Update metadata
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        setTemplates([]); // Ensure templates is empty on failure
      }
    };
    fetchTemplates();
  }, [searchParams, metaData.currentPage]);

  // Handle template pagination controls
  const handlePreviousTemplatePage = () => {
    if (metaData.currentPage > 1) {
      setMetaData((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextTemplatePage = () => {
    if (metaData.currentPage < metaData.totalPages) {
      setMetaData((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  // Handle tag toggle
  const handleTagToggle = (tagValue: string) => {
    setSearchParams((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter((t) => t !== tagValue)
        : [...prev.tags, tagValue],
    }));
    setMetaData((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 when filters change
  };

  return (
    <div
      className={`p-8 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Templates Heading and Show/Hide Filters */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Search Code Templates</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Filters Section */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {/* Search by Title */}
        <div className="mb-6">
          <input
            type="text"
            className={`w-full px-4 py-2 rounded-md border ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                : "bg-gray-100 text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
            placeholder="Search by title..."
            value={searchParams.title}
            onChange={(e) =>
              setSearchParams((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        {/* Search by Explanation */}
        <div className="mb-6">
          <input
            type="text"
            className={`w-full px-4 py-2 rounded-md border ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                : "bg-gray-100 text-black border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            }`}
            placeholder="Search by explanation..."
            value={searchParams.explanation}
            onChange={(e) =>
              setSearchParams((prev) => ({
                ...prev,
                explanation: e.target.value,
              }))
            }
          />
        </div>

        {/* Fork filter */}
        <div className="mb-6 flex items-center gap-4">
          <input
            type="checkbox"
            id="forkedOnly"
            checked={searchParams.forkedOnly}
            onChange={() =>
              setSearchParams((prev) => ({
                ...prev,
                forkedOnly: !prev.forkedOnly,
              }))
            }
            className="h-5 w-5"
          />
          <label htmlFor="forkedOnly" className="text-sm">
            Show Only Forked Templates
          </label>
        </div>
      </div>

      {/* Template Results */}
      <div>
        {templates.length === 0 ? (
          <p className="text-gray-400">No templates found</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
              {templates.map((template) => (
                <div
                  key={template.tID}
                  className={`${
                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                  } p-4 rounded-lg shadow-lg`}
                >
                  <h3 className="text-xl font-semibold">{template.title}</h3>
                  <p className="text-gray-400 mt-2">{template.explanation}</p>
                  <div className="flex gap-2 mt-4">
                    {template.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      Created by: {template.user.firstName}{" "}
                      {template.user.lastName} ({template.user.email})
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                onClick={handlePreviousTemplatePage}
                disabled={metaData.currentPage === 1}
                className={`px-4 py-2 rounded-md ${
                  metaData.currentPage === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Previous
              </button>
              <span className="text-sm">
                Page {metaData.currentPage} of {metaData.totalPages}
              </span>
              <button
                onClick={handleNextTemplatePage}
                disabled={metaData.currentPage === metaData.totalPages}
                className={`px-4 py-2 rounded-md ${
                  metaData.currentPage === metaData.totalPages
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CodeTemplateSearch;
