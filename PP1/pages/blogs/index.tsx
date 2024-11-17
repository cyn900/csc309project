import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from "../../contexts/ThemeContext";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { FaTrash, FaEdit } from 'react-icons/fa';

interface Blog {
  bID: number;
  title: string;
  description: string;
  tags: { value: string }[];
  templates: { title: string }[];
  user: { 
    firstName: string; 
    lastName: string;
    uID: number;
  };
  _count: {
    upvoters: number;
    downvoters: number;
    comments: number;
  };
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
}

interface Tag {
  value: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

const BlogsPage = () => {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [searchParams, setSearchParams] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    templates: [] as string[],
    method: 'default' as 'default' | 'popular' | 'controversial',
    page: 1,
    pageSize: 10
  });
  const [templateSearch, setTemplateSearch] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<{ title: string; tID: number }[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [customPageSize, setCustomPageSize] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams();
        
        if (searchParams.title) params.append('title', searchParams.title);
        if (searchParams.content) params.append('content', searchParams.content);
        if (searchParams.tags.length) {
          searchParams.tags.forEach(tag => {
            params.append('tags', tag);
          });
        }
        if (searchParams.templates.length) {
          searchParams.templates.forEach(template => {
            params.append('templates', template);
          });
        }
        params.append('method', searchParams.method);
        params.append('page', searchParams.page.toString());
        params.append('pageSize', searchParams.pageSize.toString());

        const response = await axios.get(`/api/blog/search?${params.toString()}`, {
          headers: { Authorization: token }
        });
        
        setBlogs(response.data.blogs || []);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
        setBlogs([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [searchParams]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('/api/tags');
        setAvailableTags(response.data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (templateSearch.trim()) {
        try {
          const response = await axios.get(`/api/templates?search=${templateSearch}`);
          setAvailableTemplates(response.data);
        } catch (error) {
          console.error('Failed to fetch templates:', error);
        }
      } else {
        setAvailableTemplates([]);
      }
    };

    const debounceTimer = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(debounceTimer);
  }, [templateSearch]);

  const handleTagToggle = (tagValue: string) => {
    setSearchParams(prev => ({
      ...prev,
      tags: prev.tags.includes(tagValue)
        ? prev.tags.filter(t => t !== tagValue)
        : [...prev.tags, tagValue],
      page: 1 // Reset page when changing filters
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, page: 1 })); // Reset to first page on new search
  };

  const handleTemplateInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && templateSearch.trim()) {
      handleTemplateToggle(templateSearch.trim());
      setTemplateSearch(''); // Clear input after adding
    }
  };

  const handleTemplateToggle = (templateTitle: string) => {
    setSearchParams(prev => ({
      ...prev,
      templates: prev.templates.includes(templateTitle)
        ? prev.templates.filter(t => t !== templateTitle)
        : [...prev.templates, templateTitle],
      page: 1
    }));
  };

  const handleCreateClick = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to create a blog');
      return;
    }
    router.push('/blogs/create');
  };

  const handleVote = async (blogId: number, voteType: 'upvote' | 'downvote') => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to vote');
      return;
    }

    try {
      const response = await axios.post('/api/blog/vote', 
        { bID: blogId, voteType },
        { headers: { Authorization: token } }
      );

      // Update the blogs state with new vote counts
      setBlogs(prevBlogs => prevBlogs.map(blog => 
        blog.bID === blogId ? { ...blog, _count: response.data.blog._count } : blog
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to register vote');
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleCustomPageSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const size = parseInt(customPageSize);
      if (!isNaN(size) && size > 0) {
        setSearchParams(prev => ({
          ...prev,
          pageSize: size,
          page: 1 // Reset to first page when changing page size
        }));
        setCustomPageSize(''); // Clear input after setting
      }
    }
  };

  const handleDelete = async (blogId: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in first');
      return;
    }

    try {
      const response = await axios.delete(`/api/blog/delete?bID=${blogId}`, {
        headers: { Authorization: token }
      });
      
      // Remove the blog from the state
      setBlogs(prevBlogs => prevBlogs.filter(blog => blog.bID !== blogId));
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('You do not have permission to delete this blog post');
      } else {
        alert('Failed to delete blog post');
      }
      console.error('Error deleting blog:', error);
    }
  };

  const handleEdit = async (blog: Blog) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in first');
      return;
    }

    try {
      // Add 'Bearer ' prefix if not present
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const response = await axios.get('/api/user/me', {
        headers: { Authorization: authToken }
      });
      
      const currentUserID = Number(response.data.user.uID);
      const blogUserID = Number(blog.user.uID);

      if (currentUserID === blogUserID) {
        router.push(`/blogs/edit?id=${blog.bID}`);
      } else {
        alert('You do not have permission to edit this blog post');
      }
    } catch (error) {
      console.error('Error checking user permissions:', error);
      alert('Failed to verify permissions');
    }
  };

  // Filter tags based on search
  const filteredTags = availableTags
    .filter(tag => tag.value.toLowerCase().includes(tagSearch.toLowerCase()))
    .slice(0, 10); // Only take first 10 tags

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blogs</h1>
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
            onClick={handleCreateClick}
            className={`px-4 py-2 rounded-lg ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            Create Blog
          </button>
        </div>
      </div>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isSearchExpanded ? "mb-8 max-h-[2000px]" : "max-h-0"
      }`}>
        <div className="space-y-4">
          <div className={`border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchParams.title}
              onChange={(e) => setSearchParams(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />
          </div>

          <div className={`border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <input
              type="text"
              placeholder="Search by content..."
              value={searchParams.content}
              onChange={(e) => setSearchParams(prev => ({ ...prev, content: e.target.value }))}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            />
          </div>

          <div className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className="text-lg font-semibold mb-3">Filter by Tags:</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className={`w-full px-4 py-2 rounded-md border ${
                  isDarkMode 
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
            </div>

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

            <div className="flex flex-wrap gap-2">
              {filteredTags.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => handleTagToggle(tag.value)}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                    searchParams.tags.includes(tag.value)
                      ? 'bg-blue-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag.value}
                </button>
              ))}
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className="text-lg font-semibold mb-3">Filter by Templates:</h2>
            
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search templates or press Enter to add..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                onKeyDown={handleTemplateInput}
                className={`w-full px-4 py-2 rounded-md border ${
                  isDarkMode 
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
              />
              {templateSearch && availableTemplates.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}>
                  {availableTemplates.map((template) => (
                    <div
                      key={template.tID}
                      onClick={() => {
                        handleTemplateToggle(template.title);
                        setTemplateSearch('');
                      }}
                      className={`px-4 py-2 cursor-pointer ${
                        isDarkMode 
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {template.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {searchParams.templates.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Templates:</h3>
                <div className="flex flex-wrap gap-2">
                  {searchParams.templates.map((template) => (
                    <button
                      key={template}
                      onClick={() => handleTemplateToggle(template)}
                      className="bg-green-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      {template}
                      <span className="hover:text-green-200">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            {/* Method Selector */}
            <div className={`flex-1 border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="text-sm mb-2 font-medium">Sort Method:</div>
              <div className="h-10">
                <select
                  value={searchParams.method}
                  onChange={(e) => setSearchParams(prev => ({ 
                    ...prev, 
                    method: e.target.value as 'default' | 'popular' | 'controversial' 
                  }))}
                  className={`w-full h-full px-4 rounded-md border ${
                    isDarkMode 
                      ? "bg-gray-700 text-white border-gray-600"
                      : "bg-gray-100 text-black border-gray-300"
                  }`}
                >
                  <option value="default">Latest</option>
                  <option value="popular">Popular</option>
                  <option value="controversial">Controversial</option>
                </select>
              </div>
            </div>

            {/* Items per page input */}
            <div className={`flex-1 border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
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
                <span className={`text-sm whitespace-nowrap ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Current: {searchParams.pageSize}
                </span>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex-1 flex items-center h-[72px]">
              <button 
                onClick={handleSearch}
                className={`w-full h-10 rounded-lg ${
                  isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full">Loading...</div>
        ) : blogs?.length > 0 ? (
          blogs.map((blog) => (
            <div 
              key={blog.bID} 
              className={`p-6 rounded-lg shadow-lg ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              } flex flex-col justify-between hover:shadow-xl transition-shadow duration-200 overflow-hidden relative group`}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={() => handleEdit(blog)}
                  className={`p-2 rounded-full hover:bg-blue-500 hover:text-white ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                  title="Edit blog"
                >
                  <FaEdit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(blog.bID)}
                  className={`p-2 rounded-full hover:bg-red-500 hover:text-white ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                  title="Delete blog"
                >
                  <FaTrash size={16} />
                </button>
              </div>

              <div className="text-lg font-semibold mb-2">
                {blog.title}
              </div>

              <div className="flex-1">
                <p className={`mb-4 font-medium break-words whitespace-normal overflow-hidden ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: '3',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {blog.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.tags.map((tag) => (
                    <span 
                      key={tag.value} 
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      {tag.value}
                    </span>
                  ))}
                  {blog.templates.map((template) => (
                    <span 
                      key={template.title} 
                      className="bg-green-500 text-white text-xs px-2 py-1 rounded-full"
                    >
                      {template.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} my-4`} />

              <div className="mt-auto">
                <div className="text-sm mb-2">
                  By {blog.user.firstName} {blog.user.lastName}
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => handleVote(blog.bID, 'upvote')}
                    className="hover:opacity-75 flex items-center"
                  >
                    👍 <span className="ml-1">{blog._count.upvoters}</span>
                  </button>
                  <button 
                    onClick={() => handleVote(blog.bID, 'downvote')}
                    className="hover:opacity-75 flex items-center"
                  >
                    👎 <span className="ml-1">{blog._count.downvoters}</span>
                  </button>
                  <span className="flex items-center">
                    💬 <span className="ml-1">{blog._count.comments}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">No blogs found</div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(searchParams.page - 1)}
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
            onClick={() => handlePageChange(searchParams.page + 1)}
            disabled={searchParams.page >= pagination.totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              isDarkMode 
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } ${searchParams.page >= pagination.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Showing{' '}
              <span className="font-medium">
                {((searchParams.page - 1) * searchParams.pageSize) + 1}
              </span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(searchParams.page * searchParams.pageSize, pagination.totalItems)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{pagination.totalItems}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(searchParams.page - 1)}
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
              {[...Array(pagination.totalPages)].map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    searchParams.page === idx + 1
                      ? isDarkMode
                        ? "bg-gray-700 text-white"
                        : "bg-blue-600 text-white"
                      : isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(searchParams.page + 1)}
                disabled={searchParams.page >= pagination.totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                  isDarkMode 
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${searchParams.page >= pagination.totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;
