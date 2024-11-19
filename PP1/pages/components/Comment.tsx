import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

interface CommentProps {
  comment: {
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
    subComments?: CommentProps["comment"][];
  };
  level?: number;
  onVote: (commentId: number, voteType: "upvote" | "downvote") => Promise<void>;
  onReply: (commentId: number, content: string) => Promise<void>;
  onLoadSubComments: (commentId: number) => Promise<void>;
  onLoadMore: (commentId: number) => Promise<void>;
  isExpanded: boolean;
  hasMoreComments: boolean;
  isDarkMode: boolean;
  currentSubPage: number;
  maxLevel: number;
  onSubPageChange: (commentId: number, newPage: number) => void;
}

const Comment = ({
  comment,
  level = 0,
  onVote,
  onReply,
  onLoadSubComments,
  onLoadMore,
  isExpanded,
  hasMoreComments,
  isDarkMode,
  currentSubPage,
  onSubPageChange,
  maxLevel,
}: CommentProps) => {
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubCommentsVisible, setIsSubCommentsVisible] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.cID, replyContent);
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in to vote");
      return;
    }
    await onVote(comment.cID, voteType);
  };

  const handleReplyClick = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Please log in to reply");
      return;
    }
    setIsReplying(!isReplying);
  };

  const handleLoadSubComments = async () => {
    try {
      if (level >= maxLevel) {
        router.push(`/comments/${comment.cID}`);
        return;
      }

      if (!isSubCommentsVisible) {
        await onLoadSubComments(comment.cID);
      }
      setIsSubCommentsVisible(!isSubCommentsVisible);
    } catch (error) {
      console.error("Error loading sub-comments:", error);
      alert("Failed to load replies");
    }
  };

  const shouldShowSubComments =
    level < maxLevel && isSubCommentsVisible && comment.subComments;

  return (
    <div
      className={`${
        level > 0 ? "ml-4 mt-4 pl-4 border-l-2 border-gray-300" : ""
      }`}
    >
      <div
        className={`p-4 rounded-lg ${
          isDarkMode ? "bg-gray-800" : level > 0 ? "bg-gray-50" : "bg-gray-100"
        }`}
      >
        <p className="mb-2">{comment.content}</p>
        <div className="text-sm text-gray-500">
          By {comment?.user?.firstName} {comment?.user?.lastName}
        </div>

        <div className="flex items-center space-x-4 mt-2">
          <button
            onClick={() => handleVote("upvote")}
            className={`group flex items-center space-x-1 transition-all duration-200 
              ${
                comment.hasUpvoted
                  ? "text-blue-500 font-bold"
                  : isDarkMode
                  ? "text-gray-300 hover:text-blue-400"
                  : "text-gray-700 hover:text-blue-500"
              }`}
          >
            <span
              className={`transform transition-transform ${
                comment.hasUpvoted ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              👍
            </span>
            <span className={`ml-1 ${comment.hasUpvoted ? "font-bold" : ""}`}>
              {comment._count.upvoters}
            </span>
          </button>

          <button
            onClick={() => handleVote("downvote")}
            className={`group flex items-center space-x-1 transition-all duration-200 
              ${
                comment.hasDownvoted
                  ? "text-red-500 font-bold"
                  : isDarkMode
                  ? "text-gray-300 hover:text-red-400"
                  : "text-gray-700 hover:text-red-500"
              }`}
          >
            <span
              className={`transform transition-transform ${
                comment.hasDownvoted ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              👎
            </span>
            <span className={`ml-1 ${comment.hasDownvoted ? "font-bold" : ""}`}>
              {comment._count.downvoters}
            </span>
          </button>

          {comment._count.subComments > 0 && (
            <button
              onClick={handleLoadSubComments}
              className={`text-sm ${
                isDarkMode
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-500"
              }`}
            >
              {level >= 2
                ? `View Replies (${comment._count.subComments})`
                : isSubCommentsVisible
                ? "Hide Replies"
                : `Show Replies (${comment._count.subComments})`}
            </button>
          )}

          <button
            onClick={handleReplyClick}
            className={`text-sm ${
              isDarkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-500"
            }`}
          >
            Reply
          </button>
        </div>

        {isReplying && (
          <div className="mt-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className={`w-full p-3 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 text-white placeholder-gray-400"
                  : "bg-white text-black placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={2}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
                className={`px-3 py-1 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleReplySubmit}
                disabled={isSubmitting || !replyContent.trim()}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  isSubmitting || !replyContent.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isSubmitting ? "Posting..." : "Reply"}
              </button>
            </div>
          </div>
        )}

        {shouldShowSubComments && comment.subComments && (
          <div className="space-y-4 mt-4">
            {comment.subComments.map((subComment) => (
              <Comment
                key={subComment.cID}
                comment={subComment}
                level={level + 1}
                onVote={onVote}
                onReply={onReply}
                onLoadSubComments={onLoadSubComments}
                onLoadMore={onLoadMore}
                isExpanded={false}
                hasMoreComments={subComment._count.subComments > 0}
                isDarkMode={isDarkMode}
                currentSubPage={currentSubPage}
                onSubPageChange={onSubPageChange}
                maxLevel={maxLevel}
              />
            ))}
            {hasMoreComments && (
              <button
                onClick={() => onLoadMore(comment.cID)}
                className={`w-full text-center py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Load More Replies
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
