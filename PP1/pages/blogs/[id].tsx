import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from "@/contexts/ThemeContext";
import { FaArrowLeft } from 'react-icons/fa';
import Comment from '../components/Comment';

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
  const [error, setError] = useState('');
  const [commentSort, setCommentSort] = useState<'default' | 'popular' | 'controversial'>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [subCommentPages, setSubCommentPages] = useState<Record<number, number>>({});
  const COMMENTS_PER_PAGE = 5;
  const [hasMore, setHasMore] = useState(true);

  const handleVote = async (type: 'upvote' | 'downvote') => {
    if (!blog) return;

    try {
      const response = await axios.post<VoteResponse>(
        '/api/blog/vote',
        {
          bID: blog.bID,
          voteType: type
        }
      );

      if (response.data.blog) {
        setBlog(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            upvoters: response.data.blog._count.upvoters,
            downvoters: response.data.blog._count.downvoters
          }
        } : null);

        if (type === 'upvote') {
          setHasUpvoted(!hasUpvoted);
          if (hasDownvoted) setHasDownvoted(false);
        } else {
          setHasDownvoted(!hasDownvoted);
          if (hasUpvoted) setHasUpvoted(false);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        alert('Please log in to vote');
      } else {
        alert(error.response?.data?.message || 'Failed to vote');
      }
    }
  };

  const handleCommentVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Please log in to vote');
        return;
      }

      const response = await axios.post<CommentVoteResponse>(
        '/api/comment/vote',
        {
          cID: commentId,
          voteType
        },
        {
          headers: { Authorization: token }
        }
      );

      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.cID === commentId) {
            return updateCommentVote(comment, voteType, response.data.comment._count);
          }
          if (comment.subComments) {
            return {
              ...comment,
              subComments: comment.subComments.map(subComment => 
                subComment.cID === commentId 
                  ? updateCommentVote(subComment, voteType, response.data.comment._count)
                  : subComment
              )
            };
          }
          return comment;
        })
      );
    } catch (error: any) {
      console.error('Error voting on comment:', error);
      alert(error.response?.data?.message || 'Failed to vote on comment');
    }
  };

  const updateCommentVote = (
    comment: Comment, 
    voteType: 'upvote' | 'downvote', 
    newCounts: { upvoters: number; downvoters: number }
  ) => ({
    ...comment,
    _count: {
      ...comment._count,
      upvoters: newCounts.upvoters,
      downvoters: newCounts.downvoters
    },
    hasUpvoted: voteType === 'upvote' ? !comment.hasUpvoted : false,
    hasDownvoted: voteType === 'downvote' ? !comment.hasDownvoted : false
  });

  const handleCommentSubmit = async (parentCommentId: number | null = null, content: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to comment');
      return;
    }

    if (!content.trim()) {
      alert('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        '/api/comment/create',
        {
          bID: blog?.bID,
          content: content,
          pID: parentCommentId
        },
        {
          headers: { Authorization: token }
        }
      );

      const newComment: Comment = {
        cID: response.data.cID,
        content: response.data.content,
        createdAt: response.data.createdAt,
        user: {
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName
        },
        _count: {
          upvoters: 0,
          downvoters: 0,
          subComments: 0
        },
        hasUpvoted: false,
        hasDownvoted: false,
        subComments: []
      };

      const updateCommentsRecursively = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.cID === parentCommentId) {
            return {
              ...comment,
              subComments: comment.subComments 
                ? [newComment, ...comment.subComments]
                : [newComment],
              _count: {
                ...comment._count,
                subComments: comment._count.subComments + 1
              }
            };
          }
          if (comment.subComments && comment.subComments.length > 0) {
            return {
              ...comment,
              subComments: updateCommentsRecursively(comment.subComments)
            };
          }
          return comment;
        });
      };

      if (!parentCommentId) {
        setNewComment('');
        setComments(prevComments => [newComment, ...prevComments]);
      } else {
        setComments(prevComments => updateCommentsRecursively(prevComments));
      }
      
      setTotalComments(prev => prev + 1);
    } catch (error: any) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error.message) {
        alert(error.message);
      } else {
        alert('Failed to post comment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpandComment = async (commentId: number) => {
    try {
      const response = await axios.get(`/api/comment?cID=${commentId}&page=1&pageSize=${COMMENTS_PER_PAGE}`);

      setComments(prevComments => prevComments.map(comment => {
        if (comment.cID === commentId) {
          return {
            ...comment,
            subComments: response.data
          };
        }
        if (comment.subComments) {
          return {
            ...comment,
            subComments: comment.subComments.map(subComment => 
              subComment.cID === commentId
                ? { ...subComment, subComments: response.data }
                : subComment
            )
          };
        }
        return comment;
      }));

      setSubCommentPages({ ...subCommentPages, [commentId]: 1 });
      const newExpanded = new Set(expandedComments);
      newExpanded.add(commentId);
      setExpandedComments(newExpanded);
    } catch (error) {
      console.error('Error fetching sub-comments:', error);
      alert('Failed to load replies');
    }
  };

  const loadMoreSubComments = async (commentId: number) => {
    try {
      const nextPage = (subCommentPages[commentId] || 1) + 1;
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: token } : {};

      const response = await axios.get(
        `/api/comment?cID=${commentId}&page=${nextPage}&pageSize=${COMMENTS_PER_PAGE}`,
        { headers }
      );

      setComments(prevComments => prevComments.map(comment => {
        if (comment.cID === commentId) {
          return {
            ...comment,
            subComments: [
              ...(comment.subComments || []),
              ...response.data
            ]
          };
        }
        return comment;
      }));

      setSubCommentPages({ ...subCommentPages, [commentId]: nextPage });
    } catch (error) {
      console.error('Error loading more sub-comments:', error);
      alert('Failed to load more replies');
    }
  };

  const loadMoreComments = async () => {
    if (!blog || !hasMore) return;
    
    try {
      const nextPage = currentPage + 1;
      const response = await axios.get(
        `/api/blog?bID=${blog.bID}&method=${commentSort}&page=${nextPage}&pageSize=${COMMENTS_PER_PAGE}`
      );

      if (response.data.paginatedComments.length === 0) {
        setHasMore(false);
        return;
      }

      setComments(prev => [...prev, ...response.data.paginatedComments]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more comments:', error);
      alert('Failed to load more comments');
    }
  };

  useEffect(() => {
    const fetchBlogDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: token } : {};

        // Fetch blog details
        const response = await axios.get(`/api/blog?bID=${id}&method=${commentSort}&page=${currentPage}`, {
          headers
        });

        const blogData = response.data.blog;
        setBlog(blogData);
        setComments(response.data.paginatedComments);
        setTotalComments(blogData._count.comments);

        // Only check vote status if user is logged in
        if (token) {
          const userResponse = await axios.get('/api/user/me', {
            headers: { Authorization: token }
          });
          const currentUserID = userResponse.data.user.uID;

          setHasUpvoted(blogData.upvoters?.some((voter: { uID: number }) => voter.uID === currentUserID) || false);
          setHasDownvoted(blogData.downvoters?.some((voter: { uID: number }) => voter.uID === currentUserID) || false);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch blog details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogDetails();
  }, [id, commentSort, currentPage]);

  if (isLoading) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
        <div className="max-w-4xl mx-auto">Loading...</div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
        <div className="max-w-4xl mx-auto text-red-500">{error || 'Blog not found in id'}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/blogs')}
          className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode 
              ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          <FaArrowLeft /> Back to Blogs
        </button>

        <article className={`p-6 rounded-lg shadow-lg mb-8 ${
          isDarkMode ? "bg-gray-800" : "bg-gray-100"
        }`}>
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

          <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} pt-4`}>
            <div className="text-sm mb-2">
              By {blog.user.firstName} {blog.user.lastName}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  const token = localStorage.getItem('accessToken');
                  if (!token) {
                    alert('Please log in to vote');
                    return;
                  }
                  handleVote('upvote');
                }}
                className={`group flex items-center space-x-1 transition-all duration-200 
                  ${hasUpvoted 
                    ? 'text-blue-500 font-bold' 
                    : isDarkMode 
                      ? 'text-gray-300 hover:text-blue-400' 
                      : 'text-gray-700 hover:text-blue-500'
                  }`}
              >
                <span className={`transform transition-transform ${
                  hasUpvoted ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  👍
                </span>
                <span className={`ml-1 ${hasUpvoted ? 'font-bold' : ''}`}>
                  {blog._count.upvoters}
                </span>
              </button>

              <button 
                onClick={() => {
                  const token = localStorage.getItem('accessToken');
                  if (!token) {
                    alert('Please log in to vote');
                    return;
                  }
                  handleVote('downvote');
                }}
                className={`group flex items-center space-x-1 transition-all duration-200 
                  ${hasDownvoted 
                    ? 'text-red-500 font-bold' 
                    : isDarkMode 
                      ? 'text-gray-300 hover:text-red-400' 
                      : 'text-gray-700 hover:text-red-500'
                  }`}
              >
                <span className={`transform transition-transform ${
                  hasDownvoted ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  👎
                </span>
                <span className={`ml-1 ${hasDownvoted ? 'font-bold' : ''}`}>
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
              onChange={(e) => setCommentSort(e.target.value as typeof commentSort)}
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

          <div className={`mb-6 p-4 rounded-lg ${
            isDarkMode ? "bg-gray-800" : "bg-gray-100"
          }`}>
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
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode 
                      ? "bg-blue-600 hover:bg-blue-700 text-white" 
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
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
                hasMoreComments={comment._count.subComments > (COMMENTS_PER_PAGE * (subCommentPages[comment.cID] || 1))}
                isDarkMode={isDarkMode}
              />
            ))}

            {hasMore && comments.length > 0 && (
              <button
                onClick={loadMoreComments}
                className={`w-full text-center py-2 rounded-lg mt-4 ${
                  isDarkMode 
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300" 
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Load More Comments
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogDetailPage; 