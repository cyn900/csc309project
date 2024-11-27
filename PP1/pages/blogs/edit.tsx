import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [templates, setTemplates] = useState<number[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableTemplates, setAvailableTemplates] = useState<
    { tID: number; title: string }[]
  >([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [currentUserID, setCurrentUserID] = useState<number | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/blogs");
          return;
        }

        const userResponse = await axios.get("/api/user/me", {
          headers: { Authorization: token },
        });
        setCurrentUserID(userResponse.data.user.uID);

        const response = await axios.get(`/api/blog/get?bID=${id}`, {
          headers: { Authorization: token },
        });

        const blogData = response.data.blog;

        if (userResponse.data.user.uID !== blogData.user.uID) {
          alert("You do not have permission to edit this blog");

          router.push("/blogs");
          return;
        }

        setBlog(blogData);
        setTitle(blogData.title);
        setDescription(blogData.description);
        setTags(blogData.tags.map((tag: { value: string }) => tag.value));
        setTemplates(
          blogData.templates.map((template: { tID: number }) => template.tID)
        );
        setIsLoading(false);
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to fetch blog");
        setIsLoading(false);
        router.push("/blogs");
      }
    };

    fetchBlog();
  }, [id, router]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (templateSearch.trim()) {
        try {
          const response = await axios.get(
            `/api/templates?search=${templateSearch}`
          );
          setAvailableTemplates(response.data);
        } catch (error) {
          console.error("Failed to fetch templates:", error);
        }
      } else {
        setAvailableTemplates([]);
      }
    };

    const debounceTimer = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(debounceTimer);
  }, [templateSearch]);

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (tagInput.trim()) {
        if (!tags.includes(tagInput.trim())) {
          setTags([...tags, tagInput.trim()]);
        }
        setTagInput("");
      }
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTemplateToggle = (templateId: number) => {
    setTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");
      await axios.patch(
        "/api/blog/edit",
        {
          bID: id,
          title,
          description,
          tags,
          templates,
        },
        {
          headers: { Authorization: token },
        }
      );

      router.push("/blogs");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update blog");
    }
  };

  if (isLoading) return <div className="min-h-screen p-8">Loading...</div>;
  if (error)
    return <div className="min-h-screen p-8 text-red-500">{error}</div>;
  if (!blog) return <div className="min-h-screen p-8">Blog not found</div>;

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Blog</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          className="space-y-6"
        >
          <div>
            <label className="block mb-2 font-medium">
              Title
              <span className="text-sm text-gray-500 ml-2">
                ({title.length}/100 characters)
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
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
                ({description.length}/500 characters)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
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
                (Press Enter to add, {10 - tags.length} remaining)
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
              disabled={tags.length >= 10}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center 
                           transition-transform duration-200 hover:scale-105"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
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
                ({10 - templates.length} remaining)
              </span>
            </label>

            {/* Selected Templates */}
            {templates.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Templates:</h3>
                <div className="flex flex-wrap gap-2">
                  {blog?.templates.map((template) => (
                    <span
                      key={template.tID}
                      className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {template.title}
                      <button
                        type="button"
                        onClick={() => handleTemplateToggle(template.tID)}
                        className="ml-2 hover:text-red-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Template Search Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className={`w-full p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-400"
                }`}
                placeholder="Search templates..."
                disabled={templates.length >= 10}
              />
            </div>

            {/* Template Suggestions */}
            {templateSearch && availableTemplates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Suggestions:</h3>
                <div className={`rounded-md border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}>
                  {availableTemplates
                    .filter(template => !templates.includes(template.tID))
                    .slice(0, 5)
                    .map((template) => (
                      <div
                        key={template.tID}
                        onClick={() => handleTemplateToggle(template.tID)}
                        className={`px-4 py-2 cursor-pointer first:rounded-t-md last:rounded-b-md ${
                          isDarkMode 
                            ? "hover:bg-gray-700 border-gray-700" 
                            : "hover:bg-gray-100 border-gray-200"
                        } border-b last:border-b-0`}
                      >
                        {template.title}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg transition-all duration-200
                        hover:bg-blue-600 hover:scale-105"
            >
              Update Blog
            </button>
            <button
              type="button"
              onClick={() => router.push("/blogs")}
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
};

export default EditBlogPage;