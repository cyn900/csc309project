import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";

interface Template {
  tID: number;
  title: string;
  explanation: string;
  tags: { value: string }[];
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

const CodeTemplateSearch: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showFilters, setShowFilters] = useState(true); // State to toggle filters visibility
  const [tagSearch, setTagSearch] = useState("");
  const [currentTagPage, setCurrentTagPage] = useState(1); // Current page for tags
  const tagsPerPage = 10; // Tags displayed per page
  const [searchParams, setSearchParams] = useState({
    title: "",
    explanation: "",
    tags: [] as string[],
    forkedOnly: false,
    tagSearch: "",
    page: 1,
    pageSize: 10,
  });

  // Fetch all available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get("/api/tags");
        setAvailableTags(response.data);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };
    fetchTags();
  }, []);

  // Fetch templates based on search parameters
  useEffect(() => {
    const fetchTemplates = async () => {
      const queryParams = new URLSearchParams({
        title: searchParams.title,
        explanation: searchParams.explanation,
        forkedOnly: searchParams.forkedOnly.toString(),
        tags: searchParams.tags.join(","),
        page: searchParams.page.toString(),
        pageSize: searchParams.pageSize.toString(),
      });

      try {
        const response = await axios.get(
          `/api/templates?${queryParams.toString()}`
        );
        setTemplates(response.data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      }
    };
    fetchTemplates();
  }, [searchParams]);

  // Handle tag toggle
  const handleTagToggle = (tagValue: string) => {
    setSearchParams((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter((t) => t !== tagValue)
        : [...prev.tags, tagValue],
    }));
  };

  // Filtered tags for the current page
  const filteredTags = availableTags.filter((tag) =>
    tag.value.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const totalTagPages = Math.ceil(filteredTags.length / tagsPerPage);
  const currentTags = filteredTags.slice(
    (currentTagPage - 1) * tagsPerPage,
    currentTagPage * tagsPerPage
  );

  // Handle pagination controls
  const handlePreviousTagPage = () => {
    if (currentTagPage > 1) setCurrentTagPage((prev) => prev - 1);
  };

  const handleNextTagPage = () => {
    if (currentTagPage < totalTagPages) setCurrentTagPage((prev) => prev + 1);
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

      {/* Filters Section with Animation */}
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
        {/* Tags and Template Results */}
        <div
          className={`border rounded-lg p-4 mt-4 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2 className="text-lg font-semibold mb-3">Filter by Tags:</h2>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => {
                setTagSearch(e.target.value);
                setCurrentTagPage(1); // Reset to page 1 on search
              }}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />
          </div>

          {/* Paginated Tags */}
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <button
                key={tag.value}
                onClick={() => handleTagToggle(tag.value)}
                type="button"
                className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                  searchParams.tags.includes(tag.value)
                    ? "bg-blue-500 text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {tag.value}
              </button>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-4 gap-4">
            <button
              onClick={handlePreviousTagPage}
              disabled={currentTagPage === 1}
              className={`px-4 py-2 rounded-md ${
                currentTagPage === 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Previous
            </button>
            <span className="text-sm">
              Page {currentTagPage} of {totalTagPages}
            </span>
            <button
              onClick={handleNextTagPage}
              disabled={currentTagPage === totalTagPages}
              className={`px-4 py-2 rounded-md ${
                currentTagPage === totalTagPages
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Template Results */}
      <div>
        {templates.length === 0 ? (
          <p className="text-gray-400">No templates found</p>
        ) : (
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

                {/* Display tags */}
                <div className="flex gap-2 mt-4">
                  {template.tags.map((tag) => (
                    <span
                      key={tag.value}
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      {tag.value}
                    </span>
                  ))}
                </div>

                {/* Indicate forked templates */}
                <div className="mt-4">
                  {template.fork && (
                    <span className="text-blue-400">
                      Forked from another template
                    </span>
                  )}
                </div>

                {/* Display user information */}
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    Created by: {template.user.firstName}{" "}
                    {template.user.lastName} ({template.user.email})
                  </p>
                  <img
                    src={template.user.avatar}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full mt-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeTemplateSearch;
