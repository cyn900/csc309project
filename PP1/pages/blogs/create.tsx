import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';

interface Template {
  tID: number;
  title: string;
  tags: { value: string }[];
}

export default function CreateBlog() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    templates: [] as string[]
  });
  
  const [tagInput, setTagInput] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState({ title: 0, description: 0 });

  // Fetch templates with debouncing
  useEffect(() => {
    const fetchTemplates = async () => {
      if (templateSearch.trim()) {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await axios.get('/api/templates', {
            headers: { Authorization: token },
            params: {
              search: templateSearch.trim()
            }
          });
          console.log('Templates response:', response.data);
          
          // Extract templates from the response
          const templates = response.data || [];
          setAvailableTemplates(templates);
        } catch (error) {
          console.error('Failed to fetch templates:', error);
          setAvailableTemplates([]);
        }
      } else {
        setAvailableTemplates([]);
      }
    };

    const debounceTimer = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(debounceTimer);
  }, [templateSearch]);

  // Update character counts
  useEffect(() => {
    setCharCount({
      title: formData.title.length,
      description: formData.description.length
    });
  }, [formData.title, formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please log in to create a blog');
        return;
      }

      // Validate form data
      if (formData.title.length < 5) {
        setError('Title must be at least 5 characters long');
        return;
      }

      if (formData.description.length < 10) {
        setError('Description must be at least 10 characters long');
        return;
      }

      const response = await axios.post('/api/blog/create', formData, {
        headers: { Authorization: token }
      });

      if (response.status === 201) {
        router.push('/blogs');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (formData.tags.length >= 10) {
        setError('Maximum 10 tags allowed');
        return;
      }
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleTemplateAdd = (template: Template) => {
    if (formData.templates.length >= 10) {
      setError('Maximum 10 templates allowed');
      return;
    }
    if (!formData.templates.includes(template.title)) {
      setFormData(prev => ({
        ...prev,
        templates: [...prev.templates, template.title]
      }));
    }
    setTemplateSearch('');
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Blog</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">
              Title 
              <span className="text-sm text-gray-500 ml-2">
                ({charCount.title}/100 characters)
              </span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                title: e.target.value.slice(0, 100)
              }))}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500" 
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Enter your blog title..."
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Description
              <span className="text-sm text-gray-500 ml-2">
                ({charCount.description}/500 characters)
              </span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: e.target.value.slice(0, 500)
              }))}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500" 
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Write your blog description..."
              rows={6}
              required
              maxLength={500}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Tags 
              <span className="text-sm text-gray-500 ml-2">
                (Press Enter to add, {10 - formData.tags.length} remaining)
              </span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagAdd}
              className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 focus:border-blue-500" 
                  : "bg-white border-gray-300 focus:border-blue-400"
              }`}
              placeholder="Type a tag and press Enter..."
              disabled={formData.tags.length >= 10}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center 
                           transition-transform duration-200 hover:scale-105"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      tags: prev.tags.filter(t => t !== tag)
                    }))}
                    className="ml-2 hover:text-red-200 transition-colors duration-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Templates
              <span className="text-sm text-gray-500 ml-2">
                ({10 - formData.templates.length} remaining)
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 focus:border-blue-500" 
                    : "bg-white border-gray-300 focus:border-blue-400"
                }`}
                placeholder="Search templates..."
                disabled={formData.templates.length >= 10}
              />
              {templateSearch && availableTemplates.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
                  {availableTemplates.map((template) => (
                    <div
                      key={template.tID}
                      onClick={() => handleTemplateAdd(template)}
                      className={`p-3 cursor-pointer transition-colors duration-200 ${
                        isDarkMode 
                          ? "hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div>{template.title}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.tags.map(tag => (
                          <span 
                            key={tag.value}
                            className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full"
                          >
                            {tag.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.templates.map((template) => (
                <span
                  key={template}
                  className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center
                           transition-transform duration-200 hover:scale-105"
                >
                  {template}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      templates: prev.templates.filter(t => t !== template)
                    }))}
                    className="ml-2 hover:text-red-200 transition-colors duration-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-blue-500 text-white rounded-lg transition-all duration-200
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 hover:scale-105'}`}
            >
              {isSubmitting ? 'Creating...' : 'Create Blog'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/blogs')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg transition-all duration-200
                       hover:bg-gray-600 hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
