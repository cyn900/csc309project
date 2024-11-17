import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useTheme } from "@/contexts/ThemeContext";
import { FaArrowLeft } from 'react-icons/fa';

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

      setComments(prevComments => prevComments.map(comment => {
        if (comment.cID === commentId) {
          return {
            ...comment,
            _count: {
              ...comment._count,
              upvoters: response.data.comment._count.upvoters,
              downvoters: response.data.comment._count.downvoters
            },
            hasUpvoted: voteType === 'upvote' ? !comment.hasUpvoted : false,
            hasDownvoted: voteType === 'downvote' ? !comment.hasDownvoted : false
          };
        }
        return comment;
      }));
    } catch (error: any) {
      console.error('Error voting on comment:', error);
      alert(error.response?.data?.message || 'Failed to vote on comment');
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

          <div className="space-y-4">
            {comments.map((comment) => (
              <div 
                key={comment.cID}
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                <p className="mb-2">{comment.content}</p>
                <div className="text-sm text-gray-500">
                  By {comment.user.firstName} {comment.user.lastName}
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <button 
                    onClick={() => {
                      const token = localStorage.getItem('accessToken');
                      if (!token) {
                        alert('Please log in to vote');
                        return;
                      }
                      handleCommentVote(comment.cID, 'upvote');
                    }}
                    className={`group flex items-center space-x-1 transition-all duration-200 
                      ${comment.hasUpvoted 
                        ? 'text-blue-500 font-bold' 
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-blue-400' 
                          : 'text-gray-700 hover:text-blue-500'
                      }`}
                  >
                    <span className={`transform transition-transform ${
                      comment.hasUpvoted ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      👍
                    </span>
                    <span className={`ml-1 ${comment.hasUpvoted ? 'font-bold' : ''}`}>
                      {comment._count.upvoters}
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      const token = localStorage.getItem('accessToken');
                      if (!token) {
                        alert('Please log in to vote');
                        return;
                      }
                      handleCommentVote(comment.cID, 'downvote');
                    }}
                    className={`group flex items-center space-x-1 transition-all duration-200 
                      ${comment.hasDownvoted 
                        ? 'text-red-500 font-bold' 
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-red-400' 
                          : 'text-gray-700 hover:text-red-500'
                      }`}
                  >
                    <span className={`transform transition-transform ${
                      comment.hasDownvoted ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      👎
                    </span>
                    <span className={`ml-1 ${comment.hasDownvoted ? 'font-bold' : ''}`}>
                      {comment._count.downvoters}
                    </span>
                  </button>
                  <span className="flex items-center space-x-1 text-gray-500">
                    <span>💬</span>
                    <span>{comment._count.subComments}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BlogDetailPage; 