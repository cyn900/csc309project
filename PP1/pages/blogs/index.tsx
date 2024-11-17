import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from "../../contexts/ThemeContext";

interface Blog {
  bID: number;
  title: string;
  description: string;
  tags: { value: string }[];
  templates: { title: string }[];
  user: { firstName: string; lastName: string };
  _count: {
    upvoters: number;
    downvoters: number;
    comments: number;
  };
}

interface Tag {
  value: string;
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

  useEffect(() => {
    const fetchBlogs = async () => {
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
        
        setBlogs(response.data);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
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

  // Filter tags based on search
  const filteredTags = availableTags
    .filter(tag => tag.value.toLowerCase().includes(tagSearch.toLowerCase()))
    .slice(0, 10); // Only take first 10 tags

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blogs</h1>
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
      
      <div className="mb-8 space-y-4">
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

        <div className={`border rounded-lg p-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <select
            value={searchParams.method}
            onChange={(e) => setSearchParams(prev => ({ 
              ...prev, 
              method: e.target.value as 'default' | 'popular' | 'controversial' 
            }))}
            className={`w-full px-4 py-2 rounded-md border ${
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

        <button 
          onClick={handleSearch}
          className={`w-full px-4 py-2 rounded-lg ${
            isDarkMode
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          Search
        </button>
      </div>

      <div className="grid gap-6">
        {blogs.map((blog) => (
          <div 
            key={blog.bID} 
            className={`p-4 rounded-lg shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <h2 className="text-xl font-bold">{blog.title}</h2>
            <p className={`mt-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {blog.description}
            </p>
            <div className="mt-4">
              <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                By {blog.user.firstName} {blog.user.lastName}
              </span>
              <div className="mt-2 space-x-4">
                <span>👍 {blog._count.upvoters}</span>
                <span>👎 {blog._count.downvoters}</span>
                <span>💬 {blog._count.comments}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlogsPage;
