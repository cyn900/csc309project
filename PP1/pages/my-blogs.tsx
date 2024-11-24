import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaComment, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface Blog {
  bID: number;
  title: string;
  description: string;
  hidden: boolean;
  tags: { value: string }[];
  templates: { title: string }[];
  _count: {
    upvoters: number;
    downvoters: number;
    comments: number;
  };
  user: {
    firstName: string;
    lastName: string;
  };
}

interface BlogsResponse {
  blogs: Blog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const MyBlogs = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    const fetchBlogs = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get<BlogsResponse>(
          `/api/user/blog?page=${currentPage}&pageSize=${pageSize}`,
          {
            headers: { Authorization: token },
          }
        );

        setBlogs(response.data.blogs);
        setTotalPages(Math.ceil(response.data.totalCount / pageSize));
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage, router]);

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="h-6 bg-gray-400 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-400 rounded w-1/4 mb-2"></div>
                <div className="h-20 bg-gray-400 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Blogs</h1>
        
        {blogs.length === 0 ? (
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <p>You haven't posted any blogs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div
                key={blog.bID}
                className={`p-6 rounded-lg shadow-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } flex flex-col justify-between hover:shadow-xl transition-shadow duration-200 overflow-hidden relative group ${
                  blog.hidden ? 'opacity-75' : ''
                }`}
              >
                <div>
                  <Link href={`/blogs/${blog.bID}`}>
                    <h2 className="text-xl font-semibold hover:underline mb-2">
                      {blog.title}
                    </h2>
                  </Link>

                  <div className="flex items-center space-x-2 mb-4">
                    {blog.hidden ? (
                      <span className="flex items-center text-yellow-500 text-sm">
                        <FaEyeSlash className="mr-1" /> Hidden
                      </span>
                    ) : (
                      <span className="flex items-center text-green-500 text-sm">
                        <FaEye className="mr-1" /> Visible
                      </span>
                    )}
                  </div>

                  <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {truncateContent(blog.description)}
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
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`flex items-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <FaThumbsUp className="mr-1" />
                      {blog._count.upvoters}
                    </span>
                    <span className={`flex items-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <FaThumbsDown className="mr-1" />
                      {blog._count.downvoters}
                    </span>
                    <span className={`flex items-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <FaComment className="mr-1" />
                      {blog._count.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1 || totalPages === 0}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${(currentPage <= 1 || totalPages === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } ${(currentPage >= totalPages || totalPages === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  {totalPages === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalPages * pageSize)}
                </span>{" "}
                of <span className="font-medium">{totalPages * pageSize}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage <= 1 || totalPages === 0}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${(currentPage <= 1 || totalPages === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Page numbers */}
                {[...Array(Math.max(totalPages, 1))].map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    disabled={totalPages === 0}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === idx + 1
                        ? isDarkMode
                          ? "bg-gray-700 text-white"
                          : "bg-blue-600 text-white"
                        : isDarkMode
                        ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } ${totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages || totalPages === 0}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${(currentPage >= totalPages || totalPages === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBlogs; 