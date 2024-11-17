import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from "../../contexts/ThemeContext";

interface Blog {
  bID: number;
  title: string;
  description: string;
  tags: { value: string }[];
  templates: { tID: number; title: string }[];
  hidden: boolean;
  user: {
    uID: number;
  };
}

const EditBlogPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isDarkMode } = useTheme();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [templates, setTemplates] = useState<number[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<{ tID: number; title: string }[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [currentUserID, setCurrentUserID] = useState<number | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/blogs');
          return;
        }

        const userResponse = await axios.get('/api/user/me', {
          headers: { Authorization: token }
        });
        setCurrentUserID(userResponse.data.user.uID);

        const response = await axios.get(`/api/blog/get?bID=${id}`, {
          headers: { Authorization: token }
        });
        
        const blogData = response.data.blog;

        if (userResponse.data.user.uID !== blogData.user.uID) {
          alert('You do not have permission to edit this blog');
          console.log('User ID:', userResponse.data.user.uID);
          console.log('Blog User ID:', blogData.user.uID);
          router.push('/blogs');
          return;
        }

        setBlog(blogData);
        setTitle(blogData.title);
        setDescription(blogData.description);
        setTags(blogData.tags.map((tag: { value: string }) => tag.value));
        setTemplates(blogData.templates.map((template: { tID: number }) => template.tID));
        setIsLoading(false);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch blog');
        setIsLoading(false);
        router.push('/blogs');
      }
    };

    fetchBlog();
  }, [id, router]);

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

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        if (!tags.includes(tagInput.trim())) {
          setTags([...tags, tagInput.trim()]);
        }
        setTagInput('');
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTemplateToggle = (templateId: number) => {
    setTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch('/api/blog/edit', 
        {
          bID: id,
          title,
          description,
          tags,
          templates
        },
        {
          headers: { Authorization: token }
        }
      );
      
      router.push('/blogs');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update blog');
    }
  };

  if (isLoading) return <div className="min-h-screen p-8">Loading...</div>;
  if (error) return <div className="min-h-screen p-8 text-red-500">{error}</div>;
  if (!blog) return <div className="min-h-screen p-8">Blog not found</div>;

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">Edit Blog</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              placeholder="Press Enter to add tag"
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Templates</label>
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates..."
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            />
            {availableTemplates.length > 0 && (
              <div className={`mt-2 border rounded-md ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              }`}>
                {availableTemplates.map((template) => (
                  <div
                    key={template.tID}
                    onClick={() => handleTemplateToggle(template.tID)}
                    className={`px-4 py-2 cursor-pointer flex items-center justify-between ${
                      isDarkMode 
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span>{template.title}</span>
                    <input
                      type="checkbox"
                      checked={templates.includes(template.tID)}
                      onChange={() => handleTemplateToggle(template.tID)}
                      className="ml-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-6 py-2 rounded-lg ${
              isDarkMode
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            Update Blog
          </button>
          <button
            type="button"
            onClick={() => router.push('/blogs')}
            className={`px-6 py-2 rounded-lg ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBlogPage;
