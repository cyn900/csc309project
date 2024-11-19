import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { useTheme } from "@/context/ThemeContext";
import Comment from "../components/Comment";
import { FaArrowLeft } from "react-icons/fa";

type Comment = {
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
};

type CommentVoteResponse = {
  comment: {
    _count: {
      upvoters: number;
      downvoters: number;
    };
  };
};

const CommentPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isDarkMode } = useTheme();
  const [comment, setComment] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [totalComments, setTotalComments] = useState(0);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(
    new Set()
  );
  const [subCommentPages, setSubCommentPages] = useState<
    Record<number, number>
  >({});
  const COMMENTS_PER_PAGE = 5;
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [currentSubPage, setCurrentSubPage] = useState<Record<number, number>>(
    {}
  );
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchComment = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem("accessToken");
        const headers = token ? { Authorization: token } : {};

        const response = await axios.get(`/api/comment/${id}`);
        setComment(response.data);
        
        if (response.data._count.subComments) {
          const totalSubPages = Math.ceil(response.data._count.subComments / COMMENTS_PER_PAGE);
          setTotalPages(totalSubPages);
          setCurrentSubPage({ [response.data.cID]: 1 });
        }
      } catch (error) {
        console.error("Error fetching comment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComment();
  }, [id]);

  const handleCommentVote = async (
    commentId: number,
    voteType: "upvote" | "downvote"
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in to vote");
      return;
    }

    try {
      const response = await axios.post<CommentVoteResponse>(
        "/api/comment/vote",
        {
          cID: commentId.toString(),
          voteType,
        },
        {
          headers: { Authorization: token },
        }
      );

      // Update comments recursively
      const updateVotes = (comments: Comment[]): Comment[] => {
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
              subComments: updateVotes(comment.subComments),
            };
          }
          return comment;
        });
      };

      setComment((prevComment) => {
        if (!prevComment) return null;
        return updateVotes([prevComment])[0];
      });
    } catch (error: any) {
      console.error("Error voting on comment:", error);
      alert(error.response?.data?.message || "Failed to vote on comment");
    }
  };

  const handleCommentSubmit = async (
    parentCommentId: number | null = null,
    content: string
  ) => {
    const token = localStorage.getItem("accessToken");
    const userDataStr = localStorage.getItem("userData");
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    
    if (!token || !userData) {
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
          pID: parentCommentId,
        },
        {
          headers: { Authorization: token },
        }
      );

      // Create new comment with the actual content from input
      const newCommentData = {
        cID: response.data.cID,
        content: content,
        createdAt: new Date().toISOString(),
        user: {
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
        _count: {
          upvoters: 0,
          downvoters: 0,
          subComments: 0,
        },
        hasUpvoted: false,
        hasDownvoted: false,
        subComments: [],
      };

      if (parentCommentId) {
        setComment((prevComment) => {
          if (!prevComment) return null;
          const updateCommentsRecursively = (comment: Comment): Comment => {
            if (comment.cID === parentCommentId) {
              return {
                ...comment,
                subComments: [newCommentData, ...(comment.subComments || [])],
                _count: {
                  ...comment._count,
                  subComments: comment._count.subComments + 1,
                },
              };
            }
            if (comment.subComments) {
              return {
                ...comment,
                subComments: comment.subComments.map(updateCommentsRecursively),
              };
            }
            return comment;
          };
          return updateCommentsRecursively(prevComment);
        });

        setExpandedComments(prev => {
          const newSet = new Set(prev);
          newSet.add(parentCommentId);
          return newSet;
        });
      }

      setNewComment("");
      setTotalComments((prev) => prev + 1);
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      alert(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpandComment = async (commentId: number) => {
    try {
      // Check if we're collapsing
      if (expandedComments.has(commentId)) {
        setExpandedComments((prev) => {
          const newExpanded = new Set(prev);
          newExpanded.delete(commentId);
          return newExpanded;
        });
        return;
      }

      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment/${commentId}?expand=true&page=1&limit=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      setComment((prevComment) => {
        if (!prevComment) return null;
        return {
          ...prevComment,
          subComments: response.data.comments,
        };
      });

      setExpandedComments((prev) => {
        const newExpanded = new Set(prev);
        newExpanded.add(commentId);
        return newExpanded;
      });

      setSubCommentPages({ ...subCommentPages, [commentId]: 1 });
    } catch (error) {
      console.error("Error fetching sub-comments:", error);
      alert("Failed to load replies");
    }
  };

  const loadMoreSubComments = async (commentId: number) => {
    try {
      const nextPage = (subCommentPages[commentId] || 1) + 1;
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment/${commentId}?expand=true&page=${nextPage}&limit=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      setComment((prevComment) => {
        if (!prevComment) return null;
        const updateCommentsRecursively = (comment: Comment): Comment => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              subComments: [...(comment.subComments || []), ...response.data.comments],
            };
          }
          if (!comment.subComments) return comment;
          return {
            ...comment,
            subComments: comment.subComments.map(updateCommentsRecursively),
          };
        };
        return updateCommentsRecursively(prevComment);
      });

      setSubCommentPages({ ...subCommentPages, [commentId]: nextPage });
    } catch (error) {
      console.error("Error loading more sub-comments:", error);
      alert("Failed to load more replies");
    }
  };

  const updateCommentsRecursively = (comments: Comment[]): Comment[] => {
    return comments.map((comment) => {
      if (comment.cID === replyingTo) {
        return {
          ...comment,
          subComments: [
            ...(comment.subComments || []),
            newComment,
          ] as Comment[],
          _count: {
            ...comment._count,
            subComments: (comment._count.subComments || 0) + 1,
          },
        };
      }
      if (comment.subComments) {
        return {
          ...comment,
          subComments: updateCommentsRecursively(comment.subComments),
        };
      }
      return comment;
    });
  };

  const handleSubPageChange = async (commentId: number, page: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment/${commentId}?expand=true&page=${page}&limit=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      setComment((prevComment) => {
        if (!prevComment) return null;
        const updateCommentsRecursively = (comment: Comment): Comment => {
          if (comment.cID === commentId) {
            return {
              ...comment,
              subComments: response.data.comments,
              _count: {
                ...comment._count,
                subComments: response.data.totalComments
              }
            };
          }
          if (comment.subComments) {
            return {
              ...comment,
              subComments: comment.subComments.map(updateCommentsRecursively),
            };
          }
          return comment;
        };
        return updateCommentsRecursively(prevComment);
      });

      setCurrentSubPage((prev) => ({ ...prev, [commentId]: page }));
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error changing sub-comment page:", error);
      alert("Failed to load comments");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!comment) {
    return <div>Comment not found</div>;
  }

  return (
    <div
      className={`min-h-screen p-8 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 mb-6 text-blue-500 hover:text-blue-600"
        >
          <FaArrowLeft /> <span>Back</span>
        </button>

        <div key={`parent-${comment.cID}`}>
          <Comment
            comment={comment}
            level={0}
            maxLevel={1}
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
            currentSubPage={currentSubPage[comment.cID] || 1}
            onSubPageChange={handleSubPageChange}
          />
        </div>

        {comment._count.subComments > COMMENTS_PER_PAGE && (
          <div key={`pagination-${comment.cID}`} className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => handleSubPageChange(comment.cID, (currentSubPage[comment.cID] || 1) - 1)}
              disabled={!currentSubPage[comment.cID] || currentSubPage[comment.cID] === 1}
              className={`px-4 py-2 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800"
                  : "bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100"
              } disabled:cursor-not-allowed`}
            >
              Previous
            </button>

            <span className={`px-4 py-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {currentSubPage[comment.cID] || 1} of {totalPages}
            </span>

            <button
              onClick={() => handleSubPageChange(comment.cID, (currentSubPage[comment.cID] || 1) + 1)}
              disabled={currentSubPage[comment.cID] === totalPages}
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
    </div>
  );
};

export default CommentPage;
