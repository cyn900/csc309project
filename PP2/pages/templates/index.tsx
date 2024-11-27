import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { FaTrash, FaEdit, FaCode } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/router';

interface Template {
  tID: number;
  title: string;
  explanation: string;
  tags: { id: number; value: string }[];
  code: string;
  fork: boolean;
  user: {
    uID: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
}

interface Tag {
  id: number;
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
  const { currentUser } = useAuth();
  const router = useRouter();
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [metaData, setMetaData] = useState<MetaData>({
    totalItems: 0,
    currentPage: 1,
    pageSize: 5,
    totalPages: 1,
  });
  const [currentTagPage, setCurrentTagPage] = useState(1);
  const tagsPerPage = 10; // Tags per page
  const [showFilters, setShowFilters] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [searchParams, setSearchParams] = useState({
    title: "",
    explanation: "",
    tags: [] as string[],
    forkedOnly: false,
    page: 1,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [customPageSize, setCustomPageSize] = useState("");

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

  const fetchTemplates = async () => {
    setIsLoading(true);
    
    const queryParams = new URLSearchParams();
    
    if (searchParams.title) queryParams.append('title', searchParams.title);
    if (searchParams.explanation) queryParams.append('explanation', searchParams.explanation);
    queryParams.append('forkedOnly', searchParams.forkedOnly.toString());
    
    searchParams.tags.forEach(tag => {
      queryParams.append('tags', tag);
    });
    
    queryParams.append('page', searchParams.page.toString());
    queryParams.append('pageSize', searchParams.pageSize.toString());

    try {
      const response = await axios.get(`/api/templates?${queryParams.toString()}`);
      const { data, meta } = response.data;
      setTemplates(data);
      setMetaData({
        totalItems: meta.totalItems,
        currentPage: meta.currentPage,
        pageSize: meta.pageSize,
        totalPages: meta.totalPages
      });
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the initial useEffect
  useEffect(() => {
    fetchTemplates(); // Directly call fetchTemplates instead of just setting searchTriggered
  }, []); // Empty dependency array means it runs once on mount

  // Remove or modify the other useEffect that was watching searchTriggered
  // Remove this useEffect:
  // useEffect(() => {
  //   if (!searchTriggered) return;
  //   fetchTemplates();
  // }, [searchTriggered, searchParams.page, searchParams.pageSize]);

  // Replace it with this one to handle pagination changes:
  useEffect(() => {
    fetchTemplates();
  }, [searchParams.page, searchParams.pageSize]);

  const getPageNumbers = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
  
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
  
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };
  
  // Update handlePreviousTemplatePage and handleNextTemplatePage to use searchParams instead of metaData
  const handlePreviousTemplatePage = () => {
    if (searchParams.page > 1) {
      setSearchParams(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextTemplatePage = () => {
    if (searchParams.page < metaData.totalPages) {
      setSearchParams(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  // Handle tag toggle
  const handleTagToggle = (tagValue: string) => {
    setSearchParams((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter((t) => t !== tagValue)
        : [...prev.tags, tagValue],
      page: 1,
    }));
  };

  // Filter available tags based on `tagSearch`
  const filteredTags = availableTags.filter((tag) =>
    tag.value.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Paginate tags
  const totalTagPages = Math.ceil(filteredTags.length / tagsPerPage);
  const currentTags = filteredTags.slice(
    (currentTagPage - 1) * tagsPerPage,
    currentTagPage * tagsPerPage
  );

  const handlePreviousTagPage = () => {
    if (currentTagPage > 1) {
      setCurrentTagPage((prev) => prev - 1);
    }
  };

  const handleNextTagPage = () => {
    if (currentTagPage < totalTagPages) {
      setCurrentTagPage((prev) => prev + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
    fetchTemplates();
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => ({
      ...prev,
      page: newPage,
    }));
    fetchTemplates();
  };

  const handleCustomPageSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const size = parseInt(customPageSize);
      if (!isNaN(size) && size > 0) {
        setSearchParams((prev) => ({
          ...prev,
          pageSize: size,
          page: 1,
        }));
        setCustomPageSize("");
        fetchTemplates();
      }
    }
  };

  const handleDelete = async (tID: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );

    if (confirmDelete) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("You must be logged in to delete templates.");
          return;
        }

        await axios.delete(`/api/templates`, {
          headers: { Authorization: token },
          params: { tID },
        });

        // Refresh the templates list
        fetchTemplates();
        alert("Template deleted successfully.");
      } catch (error: any) {
        console.error("Failed to delete template:", error);
        if (error.response?.status === 403) {
          alert("You don't have permission to delete this template.");
        } else {
          alert("An error occurred while deleting the template.");
        }
      }
    }
  };

  const handleCreate = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in to create a template");
      return;
    }
    router.push('/templates/create');
  };

  // Update useEffect to handle URL parameters
  useEffect(() => {
    const searchQuery = router.query.search;
    const isSearching = router.query.isSearching;
    
    if (searchQuery && typeof searchQuery === 'string' && isSearching === 'true') {
      setSearchParams(prev => ({
        ...prev,
        title: searchQuery,
        page: 1, // Reset to first page
      }));
      setIsSearchExpanded(true); // Show the search filters
      fetchTemplates();
    }
  }, [router.query.search, router.query.isSearching]);

  return (
    <div
      className={`p-8 min-h-screen ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Templates Heading and Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Code Templates</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-black"
            }`}
          >
            {isSearchExpanded ? "Hide Filters" : "Show Filters"}
          </button>
          <button
            onClick={handleCreate}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSearchExpanded ? "mb-8 max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="space-y-4">
          {/* Title search */}
          <div className={`border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchParams.title}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, title: e.target.value }))}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />
          </div>

          {/* Explanation search */}
          <div className={`border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <input
              type="text"
              placeholder="Search by explanation..."
              value={searchParams.explanation}
              onChange={(e) => setSearchParams((prev) => ({ ...prev, explanation: e.target.value }))}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />
          </div>

          {/* Fork filter */}
          {/* <div className="mb-6 flex items-center gap-4">
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
          </div> */}

          {/* Tag Filtering */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Filter by Tags:</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => {
                  setTagSearch(e.target.value);
                  setCurrentTagPage(1);
                }}
                className={`w-full px-4 py-2 rounded-md border ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>

            {/* Add this section to show selected tags */}
            {searchParams.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {searchParams.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      type="button"
                      className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <span className="hover:text-blue-200">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Available tags */}
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag) => (
                <button
                  key={tag.id}
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
          </div> 
        
        <div className="flex items-center gap-4 mb-4">
          {/* Items per page input */}
          <div
              className={`flex-1 border rounded-lg p-2 ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
            <div className="text-sm mb-2 font-medium">Items per page:</div>
            <div className="flex items-center gap-2 h-10">
              <input
                type="number"
                min="1"
                placeholder="Items per page"
                value={customPageSize}
                onChange={(e) => setCustomPageSize(e.target.value)}
                onKeyDown={handleCustomPageSize}
                className={`w-full h-full px-4 rounded-md border ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
              <span
                  className={`text-sm whitespace-nowrap ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Current: {searchParams.pageSize}
                </span>
            </div>
          </div>

          {/* Search button */}
          <div className="flex-1 flex items-center h-[72px]">
            <button
              onClick={handleSearch}
              className={`w-full h-10 rounded-lg ${
                isDarkMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Search
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Templates Grid */}
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
                  } p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 relative group overflow-hidden`}
                >
                  {/* Top right section with fork sign */}
                  <div className="absolute top-3 right-2">
                    {template.fork && (
                      <span className="text-sm px-2 py-1 rounded bg-opacity-50 text-gray-400 italic" title="Forked">
                        Fork
                      </span>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    {currentUser?.id === template.user.uID && (
                      <>
                        <Link
                          href={`/templates/${template.tID}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`p-2 rounded-full transition-colors duration-200 ${
                            isDarkMode 
                              ? "text-gray-400 hover:bg-gray-700 hover:text-blue-400" 
                              : "text-gray-600 hover:bg-gray-200 hover:text-blue-600"
                          }`}
                          title="Edit template"
                        >
                          <FaEdit size={16} />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.tID);
                          }}
                          className={`p-2 rounded-full transition-colors duration-200 ${
                            isDarkMode 
                              ? "text-gray-400 hover:bg-gray-700 hover:text-red-400" 
                              : "text-gray-600 hover:bg-gray-200 hover:text-red-600"
                          }`}
                          title="Delete template"
                        >
                          <FaTrash size={16} />
                        </button>
                      </>
                    )}
                    <Link
                      href={`/code?tID=${template.tID}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        isDarkMode 
                          ? "text-gray-400 hover:bg-gray-700 hover:text-green-400" 
                          : "text-gray-600 hover:bg-gray-200 hover:text-green-600"
                      }`}
                      title="Try code"
                    >
                      <FaCode size={16} />
                    </Link>
                  </div>

                  {/* Template Content */}
                  <Link href={`/templates/${template.tID}`}>
                    <h3 className="text-xl font-semibold mt-2">{template.title.slice(0, 25)}{template.title.length > 25 && '...'}</h3>
                    <p className={`mt-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"} line-clamp-3`}>
                      {template.explanation}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {template.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                        >
                          {tag.value}
                        </span>
                      ))}
                    </div>
                    <div className={`mt-4 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <p>
                        By {template.user.firstName} {template.user.lastName}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination Controls for Templates */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
              {/* Mobile pagination */}
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={handlePreviousTemplatePage}
                  disabled={searchParams.page <= 1}
                  className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${searchParams.page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextTemplatePage}
                  disabled={searchParams.page >= metaData.totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${searchParams.page >= metaData.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Next
                </button>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Showing{" "}
                    <span className="font-medium">
                      {(searchParams.page - 1) * searchParams.pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        searchParams.page * searchParams.pageSize,
                        metaData.totalItems
                      )}
                    </span>{" "}
                    of <span className="font-medium">{metaData.totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={handlePreviousTemplatePage}
                      disabled={searchParams.page <= 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } ${searchParams.page <= 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers(searchParams.page, metaData.totalPages).map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            isDarkMode
                              ? "bg-gray-800 text-gray-300"
                              : "bg-white text-gray-700"
                          }`}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            searchParams.page === pageNum
                              ? isDarkMode
                                ? "bg-gray-700 text-white"
                                : "bg-blue-600 text-white"
                              : isDarkMode
                              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}

                    <button
                      onClick={handleNextTemplatePage}
                      disabled={searchParams.page >= metaData.totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                        isDarkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } ${searchParams.page >= metaData.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CodeTemplateSearch;
