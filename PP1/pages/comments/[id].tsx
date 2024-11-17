import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from "@/contexts/ThemeContext";
import Comment from '../components/Comment';
import { FaArrowLeft } from 'react-icons/fa';

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
};

const CommentPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isDarkMode } = useTheme();
  const [comment, setComment] = useState<Comment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComment = async () => {
      if (!id) return;
      
      try {
        const response = await axios.get(`/api/comment/${id}`);
        setComment(response.data);
      } catch (error) {
        console.error('Error fetching comment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComment();
  }, [id]);

  const handleCommentVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      await axios.post(`/api/comments/${commentId}/vote`, { voteType });
      // Refresh comment data after voting
      const response = await axios.get(`/api/comment/${id}`);
      setComment(response.data);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleCommentSubmit = async (commentId: number, content: string) => {
    try {
      await axios.post(`/api/comments/${commentId}/reply`, { content });
      // Refresh comment data after replying
      const response = await axios.get(`/api/comment/${id}`);
      setComment(response.data);
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleExpandComment = async (commentId: number) => {
    try {
      const response = await axios.get(`/api/comments/${commentId}/replies`);
      // Update the comment's subComments
      setComment(prevComment => {
        if (!prevComment) return null;
        return {
          ...prevComment,
          subComments: response.data
        };
      });
    } catch (error) {
      console.error('Error expanding comment:', error);
    }
  };

  const loadMoreSubComments = async (commentId: number) => {
    try {
      const currentSubComments = comment?.subComments?.length || 0;
      const response = await axios.get(`/api/comments/${commentId}/replies?skip=${currentSubComments}`);
      // Append new subComments to existing ones
      setComment(prevComment => {
        if (!prevComment) return null;
        return {
          ...prevComment,
          subComments: [...(prevComment.subComments || []), ...response.data]
        };
      });
    } catch (error) {
      console.error('Error loading more comments:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!comment) {
    return <div>Comment not found</div>;
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 mb-6 text-blue-500 hover:text-blue-600"
        >
          <FaArrowLeft /> <span>Back</span>
        </button>

        <Comment
          comment={comment}
          level={0}
          onVote={handleCommentVote}
          onReply={handleCommentSubmit}
          onLoadSubComments={handleExpandComment}
          onLoadMore={loadMoreSubComments}
          isExpanded={true}
          hasMoreComments={comment._count.subComments > 0}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default CommentPage;