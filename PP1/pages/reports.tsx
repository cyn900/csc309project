import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface ReportedItem {
  bID?: number;
  cID?: number;
  title?: string;
  description?: string;
  content?: string;
  hidden: boolean;
  _count: {
    blogReports?: number;
    commentReports?: number;
    upvoters: number;
    downvoters: number;
  };
  user: {
    firstName: string;
    lastName: string;
  };
  blog?: {
    bID: number;
    title: string;
  };
}

interface ReportsResponse {
  items: ReportedItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface ReportDetail {
  id: number;
  explanation: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ReportResponse {
  items: ReportDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const getPageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return [...Array(totalPages)].map((_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages
  ];
};

const Reports = () => {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'blog' | 'comment'>('blog');
  const [items, setItems] = useState<ReportedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReports, setSelectedReports] = useState<ReportDetail[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportTotalCount, setReportTotalCount] = useState(0);
  const reportPageSize = 5;
  const [filterHidden, setFilterHidden] = useState<'all' | 'hidden' | 'visible'>('all');

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get<ReportsResponse>(
          `/api/report/admin?type=${activeTab}&page=${currentPage}&pageSize=${pageSize}&filter=${filterHidden}`,
          {
            headers: { Authorization: token },
          }
        );
        
        setItems(response.data.items);
        setTotalPages(Math.ceil(response.data.totalCount / pageSize));
        setTotalCount(response.data.totalCount);
      } catch (error: any) {
        if (error.response?.status === 403) {
          router.push('/');
        }
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [activeTab, currentPage, filterHidden, router]);

  const handleToggleHidden = async (id: number, currentHidden: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await axios.patch(
        '/api/report/admin',
        {
          id,
          type: activeTab,
          hidden: !currentHidden,
        },
        {
          headers: { Authorization: token },
        }
      );

      // Update local state
      setItems(prevItems =>
        prevItems.map(item => {
          if ((activeTab === 'blog' && item.bID === id) || 
              (activeTab === 'comment' && item.cID === id)) {
            return { ...item, hidden: !currentHidden };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleTabChange = (tab: 'blog' | 'comment') => {
    setItems([]); // Clear items when switching tabs
    setCurrentPage(1); // Reset to first page
    setActiveTab(tab);
  };

  const handleViewReports = async (id: number) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await axios.get<ReportResponse>(
        `/api/report/details?type=${activeTab}&id=${id}&page=${reportPage}&pageSize=${reportPageSize}`,
        {
          headers: { Authorization: token },
        }
      );
      setSelectedReports(response.data.items);
      setReportTotalPages(Math.ceil(response.data.totalCount / reportPageSize));
      setReportTotalCount(response.data.totalCount);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };

  const ReportModal = () => {
    if (!showReportModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`max-w-2xl w-full rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-h-[80vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Report Details</h3>
            <button
              onClick={() => {
                setShowReportModal(false);
                setReportPage(1); // Reset page when closing
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            {selectedReports.map((report) => (
              <div
                key={report.id}
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <p className="font-medium mb-2">
                  Reported by: {report.user.firstName} {report.user.lastName}
                </p>
                <p className="text-sm mb-2">{report.user.email}</p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {report.explanation}
                </p>
              </div>
            ))}
          </div>
          
          {/* Report Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Showing {((reportPage - 1) * reportPageSize) + 1} to {Math.min(reportPage * reportPageSize, reportTotalCount)} of {reportTotalCount} reports
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setReportPage(prev => Math.max(prev - 1, 1))}
                disabled={reportPage <= 1}
                className={`px-2 py-1 rounded ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } ${reportPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <button
                onClick={() => setReportPage(prev => Math.min(prev + 1, reportTotalPages))}
                disabled={reportPage >= reportTotalPages}
                className={`px-2 py-1 rounded ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                } ${reportPage >= reportTotalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="h-6 bg-gray-400 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-400 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Report Management</h1>
          <div className="flex items-center gap-4">
            <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Filter:
            </label>
            <select
              value={filterHidden}
              onChange={(e) => setFilterHidden(e.target.value as 'all' | 'hidden' | 'visible')}
              className={`px-3 py-1 rounded-lg text-sm ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 border-gray-600' 
                  : 'bg-white text-gray-700 border-gray-300'
              } border`}
            >
              <option value="all">All Content</option>
              <option value="hidden">Hidden Only</option>
              <option value="visible">Visible Only</option>
            </select>
          </div>
        </div>

        {/* Update Tab Navigation buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleTabChange('blog')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'blog'
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Blogs
          </button>
          <button
            onClick={() => handleTabChange('comment')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'comment'
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All Comments
          </button>
        </div>

        {/* Updated Items List with clickable links */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={activeTab === 'blog' ? item.bID : item.cID}
              className={`p-6 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-sm`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  {activeTab === 'blog' ? (
                    <>
                      <Link href={`/blogs/${item.bID}`}>
                        <h3 className={`text-lg font-semibold mb-2 hover:underline cursor-pointer truncate ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {item.title}
                        </h3>
                      </Link>
                      {item.description && (
                        <p className={`mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Reports: {item._count.blogReports}
                        </p>
                        {(item._count.blogReports && item._count.blogReports > 0) ? (
                          <button
                            onClick={() => handleViewReports(item.bID!)}
                            className={`text-sm ${
                              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                            }`}
                          >
                            View Reports →
                          </button>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No Reports
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Link href={`/comments/${item.cID}`}>
                          <h3 className={`text-lg font-semibold hover:underline cursor-pointer ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            Comment
                          </h3>
                        </Link>
                      </div>
                      <p className={`mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {item.content}
                      </p>
                      <div className="flex items-center gap-4">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Reports: {item._count.commentReports}
                        </p>
                        {(item._count.commentReports && item._count.commentReports > 0) ? (
                          <button
                            onClick={() => handleViewReports(item.cID!)}
                            className={`text-sm ${
                              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                            }`}
                          >
                            View Reports →
                          </button>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            No Reports
                          </span>
                        )}
                        <Link 
                          href={`/blogs/${item.bID}`}
                          className={`text-sm ${
                            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                          }`}
                        >
                          View Parent Blog →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleToggleHidden(
                    activeTab === 'blog' ? item.bID! : item.cID!,
                    item.hidden
                  )}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
                    item.hidden
                      ? isDarkMode
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-green-500 hover:bg-green-600'
                      : isDarkMode
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white transition-colors`}
                >
                  {item.hidden ? 'Unhide' : 'Hide'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Replace the old pagination with the new one */}
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

                {/* Page numbers */}
                {getPageNumbers(currentPage, totalPages).map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                      disabled={totalPages === 0}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === pageNum
                          ? isDarkMode
                            ? "bg-gray-700 text-white"
                            : "bg-blue-600 text-white"
                          : isDarkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      } ${totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {pageNum}
                    </button>
                  )
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
        <ReportModal />
      </div>
    </div>
  );
};

export default Reports;
