import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface Template {
  tID: number;
  title: string;
  explanation: string;
  tags: { value: string }[];
  fork: boolean;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TemplatesResponse {
  templates: Template[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const MyTemplates = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5; // Show more templates per page
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchTemplates = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get<TemplatesResponse>(
          `/api/user/template?page=${currentPage}&pageSize=${pageSize}`,
          {
            headers: { Authorization: token },
          }
        );

        setTemplates(response.data.templates);
        setTotalPages(Math.ceil(response.data.totalCount / pageSize));
        setTotalCount(response.data.totalCount);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [currentPage, router]);

  if (isLoading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Templates</h1>
          <Link href="/templates/create">
            <button className={`px-6 py-2 rounded-lg text-sm font-medium ${
              isDarkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}>
              Create New Template
            </button>
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <p>You haven't created any templates yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Link
                  key={template.tID}
                  href={`/templates/${template.tID}`}
                  className={`${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 group`}
                >
                  <h3 className={`text-xl font-semibold mb-3 group-hover:text-blue-500 transition-colors ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {template.title}
                  </h3>
                  <p className={`text-sm mb-4 line-clamp-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}>
                    {template.explanation}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm ${
                          isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                  {template.fork && (
                    <span className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      Forked template
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
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

              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Showing{" "}
                    <span className="font-medium">
                      {totalPages === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>{" "}
                    of <span className="font-medium">{totalCount}</span>{" "}
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
          </>
        )}
      </div>
    </div>
  );
};

export default MyTemplates; 