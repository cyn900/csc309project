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
}

interface Blog {
  bID: number;
  title: string;
  description: string;
  tags: { value: string }[];
  templates: { title: string }[];
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    upvoters: number;
    downvoters: number;
    comments: number;
  };
  upvoters: { uID: number }[];
  downvoters: { uID: number }[];
}

interface VoteResponse {
  message: string;
  blog: {
    _count: {
      upvoters: number;
      downvoters: number;
      comments: number;
    };
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

const BlogDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isDarkMode } = useTheme();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentSort, setCommentSort] = useState<
    "default" | "popular" | "controversial"
  >("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set()
  );
  const [subCommentPages, setSubCommentPages] = useState<
    Record<number, number>
  >({});
  const [totalPages, setTotalPages] = useState(1);
  const COMMENTS_PER_PAGE = 5;

  const handleVote = async (type: "upvote" | "downvote") => {
    if (!blog) return;

    try {
      const response = await axios.post<VoteResponse>("/api/blog/vote", {
        bID: blog.bID,
        voteType: type,
      });

      if (response.data.blog) {
        setBlog((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  upvoters: response.data.blog._count.upvoters,
                  downvoters: response.data.blog._count.downvoters,
                },
              }
            : null
        );

        if (type === "upvote") {
          setHasUpvoted(!hasUpvoted);
          if (hasDownvoted) setHasDownvoted(false);
        } else {
          setHasDownvoted(!hasDownvoted);
          if (hasUpvoted) setHasUpvoted(false);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert("Please log in to vote");
      } else {
        alert(error.response?.data?.message || "Failed to vote");
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
              hasDownvoted:
                voteType === "downvote" ? !comment.hasDownvoted : false,
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

  const updateCommentsRecursively = (
    comments: Comment[],
    newCommentData: Comment
  ): Comment[] => {
    return comments.map((comment) => {
      if (comment.cID === replyingTo) {
        return {
          ...comment,
          subComments: [...(comment.subComments || []), newCommentData],
          _count: {
            ...comment._count,
            subComments: (comment._count.subComments || 0) + 1,
          },
        };
      }
      if (comment.subComments) {
        return {
          ...comment,
          subComments: updateCommentsRecursively(
            comment.subComments,
            newCommentData
          ),
        };
      }
      return comment;
    });
  };

  const handleCommentSubmit = async (
    parentCommentId: number | null = null,
    content: string
  ) => {
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
      // Post the new comment
      await axios.post(
        "/api/comment/create",
        {
          bID: blog?.bID,
          content: content,
          pID: parentCommentId,
        },
        {
          headers: { Authorization: token },
        }
      );

      // Clear the input
      setNewComment("");

      // Store current expanded state
      const currentExpanded = new Set(expandedComments);

      // Refetch comments to get the updated list with proper sorting
      const commentsResponse = await axios.get(
        `/api/blog?bID=${blog?.bID}&method=${commentSort}&page=${currentPage}&pageSize=${COMMENTS_PER_PAGE}`,
        { headers: { Authorization: token } }
      );

      // Refetch subcomments for all expanded comments
      const updatedComments = await Promise.all(
        commentsResponse.data.paginatedComments.map(
          async (comment: Comment) => {
            if (currentExpanded.has(comment.cID)) {
              const subResponse = await axios.get(
                `/api/comment?cID=${comment.cID}&page=1&pageSize=${COMMENTS_PER_PAGE}`,
                { headers: { Authorization: token } }
              );
              return { ...comment, subComments: subResponse.data };
            }
            return comment;
          }
        )
      );

      setComments(updatedComments);

      // Update counts
      if (blog) {
        setBlog((prev) => ({
          ...prev!,
          _count: {
            ...prev!._count,
            comments: prev!._count.comments + 1,
          },
        }));
      }
      setTotalComments((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      if (error.response?.status >= 400) {
        alert(
          error.response?.data?.message ||
            error.message ||
            "Failed to post comment"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpandComment = async (commentId: number) => {
    try {
      console.log("Starting handleExpandComment", { commentId });
      let isExpanding = false;

      // First update the expanded state immediately
      setExpandedComments((prev) => {
        console.log("Previous expanded state:", Array.from(prev));
        const newExpanded = new Set(prev);
        if (newExpanded.has(commentId)) {
          console.log("Collapsing comment");
          newExpanded.delete(commentId);
        } else {
          console.log("Expanding comment");
          newExpanded.add(commentId);
          isExpanding = true;
        }
        console.log("New expanded state:", Array.from(newExpanded));
        return newExpanded;
      });

      // Check if the comment is currently expanded
      const isCurrentlyExpanded = expandedComments.has(commentId);
      isExpanding = !isCurrentlyExpanded;

      console.log("isExpanding:", isExpanding);
      // If we're collapsing, return early
      if (!isExpanding) {
        console.log("Returning early - collapsing");
        return;
      }

      // Then fetch the subcomments
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      console.log("Fetching subcomments");
      const response = await axios.get(
        `/api/comment?cID=${commentId}&page=1&pageSize=${COMMENTS_PER_PAGE}`,
        { headers }
      );
      console.log("Subcomments response:", response.data);

      setComments((prevComments) => {
        console.log("Updating comments with subcomments");
        return prevComments.map((comment) => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              subComments: response.data,
            };
          }
          return comment;
        });
      });

      setSubCommentPages({ ...subCommentPages, [commentId]: 1 });
    } catch (error) {
      console.error("Error fetching sub-comments:", error);
      alert("Failed to load replies");
      setExpandedComments((prev) => {
        const newExpanded = new Set(prev);
        newExpanded.delete(commentId);
        return newExpanded;
      });
    }
  };

  const loadMoreSubComments = async (commentId: number) => {
    try {
      const nextPage = (subCommentPages[commentId] || 1) + 1;
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment?cID=${commentId}&page=${nextPage}&pageSize=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              subComments: [...(comment.subComments || []), ...response.data],
            };
          }
          return comment;
        })
      );

      setSubCommentPages({ ...subCommentPages, [commentId]: nextPage });
    } catch (error) {
      console.error("Error loading more sub-comments:", error);
      alert("Failed to load more replies");
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!blog) return;

    try {
      const response = await axios.get(
        `/api/blog?bID=${blog.bID}&method=${commentSort}&page=${newPage}&pageSize=${COMMENTS_PER_PAGE}&parentId=null`
      );

      setComments(response.data.paginatedComments);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error loading comments:", error);
      alert("Failed to load comments");
    }
  };

  const handleSubPageChange = async (commentId: number, page: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment?cID=${commentId}&page=${page}&pageSize=${COMMENTS_PER_PAGE}`,
        {
          headers,
        }
      );

      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.cID === commentId) {
            return { ...comment, subComments: response.data };
          }
          return comment;
        })
      );

      setSubCommentPages({ ...subCommentPages, [commentId]: page });
    } catch (error) {
      console.error("Error changing sub-comment page:", error);
      alert("Failed to load comments");
    }
  };

  useEffect(() => {
    const fetchBlogDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: token } : {};

        const response = await axios.get(
          `/api/blog?bID=${id}&method=${commentSort}&page=${currentPage}&pageSize=${COMMENTS_PER_PAGE}&parentId=null`,
          { headers }
        );

        setBlog(response.data.blog);
        setComments(response.data.paginatedComments);
        const total = response.data.totalFirstLevelComments || 0;
        setTotalComments(total);
        setTotalPages(Math.max(1, Math.ceil(total / COMMENTS_PER_PAGE)));
      } catch (error: any) {
        setError(
          error.response?.data?.message || "Failed to fetch blog details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id, commentSort, currentPage]);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen p-8 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
        }`}
      >
        <div className="max-w-4xl mx-auto">Loading...</div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div
        className={`min-h-screen p-8 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
        }`}
      >
        <div className="max-w-4xl mx-auto text-red-500">
          {error || "Blog not found in id"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/blogs")}
          className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          <FaArrowLeft /> Back to Blogs
        </button>

        <article
          className={`p-6 rounded-lg shadow-lg mb-8 ${
            isDarkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <h1 className="text-3xl font-bold mb-4">{blog.title}</h1>

          <p className="mb-6 whitespace-pre-wrap">{blog.description}</p>

          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.map((tag) => (
              <span
                key={tag.value}
                className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
              >
                {tag.value}
              </span>
            ))}
            {blog.templates.map((template) => (
              <span
                key={template.title}
                className="bg-green-500 text-white text-sm px-3 py-1 rounded-full"
              >
                {template.title}
              </span>
            ))}
          </div>

          <div
            className={`border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            } pt-4`}
          >
            <div className="text-sm mb-2">
              By {blog.user.firstName} {blog.user.lastName}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const token = localStorage.getItem("accessToken");
                  if (!token) {
                    alert("Please log in to vote");
                    return;
                  }
                  handleVote("upvote");
                }}
                className={`group flex items-center space-x-1 transition-all duration-200 
                  ${
                    hasUpvoted
                      ? "text-blue-500 font-bold"
                      : isDarkMode
                      ? "text-gray-300 hover:text-blue-400"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
              >
                <span
                  className={`transform transition-transform ${
                    hasUpvoted ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  👍
                </span>
                <span className={`ml-1 ${hasUpvoted ? "font-bold" : ""}`}>
                  {blog._count.upvoters}
                </span>
              </button>

              <button
                onClick={() => {
                  const token = localStorage.getItem("accessToken");
                  if (!token) {
                    alert("Please log in to vote");
                    return;
                  }
                  handleVote("downvote");
                }}
                className={`group flex items-center space-x-1 transition-all duration-200 
                  ${
                    hasDownvoted
                      ? "text-red-500 font-bold"
                      : isDarkMode
                      ? "text-gray-300 hover:text-red-400"
                      : "text-gray-700 hover:text-red-500"
                  }`}
              >
                <span
                  className={`transform transition-transform ${
                    hasDownvoted ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  👎
                </span>
                <span className={`ml-1 ${hasDownvoted ? "font-bold" : ""}`}>
                  {blog._count.downvoters}
                </span>
              </button>

              <span className="flex items-center space-x-1 text-gray-500">
                <span>💬</span>
                <span>{blog._count.comments}</span>
              </span>
            </div>
          </div>
        </article>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Comments</h2>
            <select
              value={commentSort}
              onChange={(e) =>
                setCommentSort(e.target.value as typeof commentSort)
              }
              className={`px-4 py-2 rounded-lg ${
                isDarkMode
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              <option value="default">Latest</option>
              <option value="popular">Most Popular</option>
              <option value="controversial">Most Discussed</option>
            </select>
          </div>

          <div
            className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
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
                {isSubmitting ? "Posting..." : "Post Comment"}
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
    </div>
  );
};

export default BlogDetailPage;
