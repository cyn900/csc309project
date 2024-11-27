import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import { FaArrowLeft } from "react-icons/fa";
import Comment from "../components/Comment";

interface Comment {
  cID: number;
  content: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    upvoters: number;
    downvoters: number;
    subComments: number;
  };
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
  subComments?: Comment[];
  blog?: {
    bID: number;
  };
}

interface CommentVoteResponse {
  message: string;
  comment: {
    _count: {
      upvoters: number;
      downvoters: number;
    };
  };
}

const CommentDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isDarkMode } = useTheme();
  const COMMENTS_PER_PAGE = 5;

  const [comment, setComment] = useState<Comment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [subCommentPages, setSubCommentPages] = useState<Record<number, number>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportExplanation, setReportExplanation] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCommentDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: token } : {};

        // Fetch the parent comment first
        const parentResponse = await axios.get(`/api/comment/${id}`, { headers });
        setComment(parentResponse.data);

        // Fetch the subcomments
        const response = await axios.get(
          `/api/comment?cID=${id}&page=${currentPage}&pageSize=${COMMENTS_PER_PAGE}`,
          { headers }
        );

        setComments(response.data.comments);
        setTotalComments(response.data.total);
        setTotalPages(Math.max(1, Math.ceil(response.data.total / COMMENTS_PER_PAGE)));
      } catch (error: any) {
        setError(error.response?.data?.message || "Failed to fetch comment details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommentDetails();
  }, [id, currentPage]);

  const handleCommentReport = (commentId: number | null = null) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in first");
      return;
    }
    
    setReportingCommentId(commentId);
    setReportExplanation("");
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportExplanation.trim()) return;

    const token = localStorage.getItem("accessToken");
    try {
      const endpoint = reportingCommentId ? "/api/report/comment" : "/api/report/blog";
      const payload = reportingCommentId 
        ? { cID: reportingCommentId, explanation: reportExplanation }
        : { bID: comment!.blog!.bID, explanation: reportExplanation };

      await axios.post(endpoint, payload, { headers: { Authorization: token } });
      alert("Thank you for your report. Our moderators will review it shortly.");
      setIsReportModalOpen(false);
      setReportExplanation("");
      setReportingCommentId(null);
    } catch (error: any) {
      if (error.response?.status === 409) {
        const itemType = reportingCommentId ? "comment" : "blog";
        if (confirm(`You have already reported this ${itemType}. Would you like to delete your old report and submit a new one?`)) {
          try {
            const deleteEndpoint = reportingCommentId 
              ? `/api/report/comment?cID=${reportingCommentId}`
              : `/api/report/blog?bID=${comment!.blog!.bID}`;
            
            const endpoint = reportingCommentId ? "/api/report/comment" : "/api/report/blog";
            const payload = reportingCommentId 
              ? { cID: reportingCommentId, explanation: reportExplanation }
              : { bID: comment!.blog!.bID, explanation: reportExplanation };

            await axios.delete(deleteEndpoint, { headers: { Authorization: token } });
            await axios.post(endpoint, payload, { headers: { Authorization: token } });
            
            alert("Your new report has been submitted successfully.");
            setIsReportModalOpen(false);
            setReportExplanation("");
            setReportingCommentId(null);
          } catch (deleteError) {
            console.error("Error updating report:", deleteError);
            alert("Failed to update report. Please try again later.");
          }
        }
      } else {
        alert("Failed to submit report. Please try again later.");
        console.error("Error reporting:", error);
      }
    }
  };
  
  const handleCommentVote = async (
    commentId: number,
    voteType: "upvote" | "downvote"
  ) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Please log in to vote");
        return;
      }

      const response = await axios.post<CommentVoteResponse>(
        "/api/comment/vote",
        {
          cID: commentId,
          voteType,
        },
        {
          headers: { Authorization: token },
        }
      );

      // Update parent comment if the vote was for it
      if (comment && commentId === comment.cID) {
        setComment(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            _count: {
              ...prev._count,
              upvoters: response.data.comment._count.upvoters,
              downvoters: response.data.comment._count.downvoters,
            },
            hasUpvoted: voteType === "upvote" ? !prev.hasUpvoted : false,
            hasDownvoted: voteType === "downvote" ? !prev.hasDownvoted : false,
          };
        });
      }

      // Update comments list
      const updateVoteRecursively = (comments: Comment[]): Comment[] => {
        return comments.map((comment) => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              _count: {
                ...comment._count,
                upvoters: response.data.comment._count.upvoters,
                downvoters: response.data.comment._count.downvoters,
              },
              hasUpvoted: voteType === "upvote" ? !comment.hasUpvoted : false,
              hasDownvoted: voteType === "downvote" ? !comment.hasDownvoted : false,
            };
          }
          if (comment.subComments) {
            return {
              ...comment,
              subComments: updateVoteRecursively(comment.subComments),
            };
          }
          return comment;
        });
      };

      setComments((prevComments) => updateVoteRecursively(prevComments));
    } catch (error: any) {
      console.error("Error voting on comment:", error);
      alert(error.response?.data?.message || "Failed to vote on comment");
    }
  };

  const handleCommentSubmit = async (parentCommentId: number | null = null, content: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in to comment");
      return;
    }

    if (!content.trim()) {
      alert("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "/api/comment/create",
        {
          bID: comment?.blog?.bID,
          content: content,
          pID: parentCommentId || comment?.cID,
        },
        {
          headers: { Authorization: token },
        }
      );

      setNewComment("");
      
      // Refresh the comments list
      const updatedResponse = await axios.get(
        `/api/comment?cID=${id}&page=${currentPage}&pageSize=${COMMENTS_PER_PAGE}`,
        { headers: { Authorization: token } }
      );

      setComments(updatedResponse.data.comments);
      setTotalComments(updatedResponse.data.total);
      setTotalPages(Math.max(1, Math.ceil(updatedResponse.data.total / COMMENTS_PER_PAGE)));
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      alert(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpandComment = async (commentId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment?cID=${commentId}&page=1&pageSize=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      // Update the comments state by adding subComments to the correct comment
      setComments((prevComments) => {
        return prevComments.map((comment) => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              subComments: response.data.comments,
            };
          }
          return comment;
        });
      });

      // Add the comment to expanded set
      setExpandedComments((prev) => {
        const newSet = new Set(prev);
        newSet.add(commentId);
        return newSet;
      });

      // Initialize sub-comment page
      setSubCommentPages((prev) => ({
        ...prev,
        [commentId]: 1,
      }));
    } catch (error) {
      console.error("Error loading sub-comments:", error);
      alert("Failed to load replies");
    }
  };

  const loadMoreSubComments = async (commentId: number) => {
    try {
      const currentPage = subCommentPages[commentId] || 1;
      const nextPage = currentPage + 1;
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment?cID=${commentId}&page=${nextPage}&pageSize=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      // Update the comments state by appending new subComments
      setComments((prevComments) => {
        return prevComments.map((comment) => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              subComments: [
                ...(comment.subComments || []),
                ...response.data.comments,
              ],
            };
          }
          return comment;
        });
      });

      // Update the page number for this comment
      setSubCommentPages((prev) => ({
        ...prev,
        [commentId]: nextPage,
      }));
    } catch (error) {
      console.error("Error loading more sub-comments:", error);
      alert("Failed to load more replies");
    }
  };

  const handleSubPageChange = (commentId: number, page: number) => {
    setSubCommentPages((prev) => ({
      ...prev,
      [commentId]: page,
    }));
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment?cID=${id}&page=${newPage}&pageSize=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      setComments(response.data.comments);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error changing page:", error);
      alert("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
        <div className="max-w-4xl mx-auto">Loading...</div>
      </div>
    );
  }

  if (error || !comment) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
        <div className="max-w-4xl mx-auto text-red-500">
          {error || "Comment not found"}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          <FaArrowLeft /> Back
        </button>

        {/* Parent Comment */}
        <div className={`p-6 rounded-lg shadow-lg mb-8 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <Comment
            comment={comment}
            onVote={handleCommentVote}
            onReply={handleCommentSubmit}
            onReport={(commentId) => handleCommentReport(commentId)}
            onLoadSubComments={handleExpandComment}
            onLoadMore={loadMoreSubComments}
            isExpanded={expandedComments.has(comment.cID)}
            hasMoreComments={
              comment._count.subComments >
              COMMENTS_PER_PAGE * (subCommentPages[comment.cID] || 1)
            }
            isDarkMode={isDarkMode}
            currentSubPage={subCommentPages[comment.cID] || 1}
            onSubPageChange={(page) => handleSubPageChange(comment.cID, page)}
            level={0}
            maxLevel={1}
            hideRepliesButton={true}
            hideShowRepliesButton={true}
          />
        </div>

        {/* Reply Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Replies</h2>
          
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              className={`w-full p-3 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 text-white placeholder-gray-400"
                  : "bg-white text-black placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => handleCommentSubmit(null, newComment)}
                disabled={isSubmitting || !newComment.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isSubmitting || !newComment.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment
                key={comment.cID}
                comment={comment}
                onVote={handleCommentVote}
                onReply={handleCommentSubmit}
                onReport={(commentId) => handleCommentReport(commentId)}
                onLoadSubComments={handleExpandComment}
                onLoadMore={loadMoreSubComments}
                isExpanded={expandedComments.has(comment.cID)}
                hasMoreComments={
                  comment._count.subComments >
                  COMMENTS_PER_PAGE * (subCommentPages[comment.cID] || 1)
                }
                isDarkMode={isDarkMode}
                currentSubPage={subCommentPages[comment.cID] || 1}
                onSubPageChange={(page) =>
                  handleSubPageChange(comment.cID, page)
                }
                level={0}
                maxLevel={1}
              />
            ))}

            {/* Add pagination controls */}
            {comments.length > 0 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800"
                      : "bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100"
                  } disabled:cursor-not-allowed`}
                >
                  Previous
                </button>

                <span
                  className={`px-4 py-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800"
                      : "bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100"
                  } disabled:cursor-not-allowed`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg p-6 max-w-md w-full mx-4`}>
            <h2 className={`text-xl font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-black"
            }`}>
              Report Comment
            </h2>
            <form onSubmit={handleReportSubmit}>
              <textarea
                value={reportExplanation}
                onChange={(e) => setReportExplanation(e.target.value)}
                placeholder="Please provide a detailed explanation of why you're reporting this comment. This will help our moderators review the content appropriately."
                className={`w-full px-4 py-2 rounded-md border mb-4 min-h-[120px] ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-gray-100 text-black border-gray-300"
                }`}
                required
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-black"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentDetailPage;
