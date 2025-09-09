"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  Trash2,
  Eye,
  User,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Author {
  id: string;
  nickname: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: Author;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: Author;
}

export default function AdminPage() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");

  useEffect(() => {
    if (
      status === "unauthenticated" ||
      (status === "authenticated" && !session?.user?.isAdmin)
    ) {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      const [postsResponse, commentsResponse] = await Promise.all([
        fetch("/api/posts"),
        fetch("/api/comments?postId=all"), // We'll need to modify the API to handle this
      ]);

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData);
      }

      // For now, we'll just show recent comments from all posts
      // In a real implementation, you'd have a dedicated admin API
      setComments([]);
    } catch (error) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
      } else {
        setError("Failed to delete post");
      }
    } catch (error) {
      setError("Failed to delete post");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      } else {
        setError("Failed to delete comment");
      }
    } catch (error) {
      setError("Failed to delete comment");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PostRow = ({ post }: { post: Post }) => (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{post.title}</h3>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{post.author.nickname}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{post.upvotes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ThumbsDown className="h-4 w-4" />
                <span>{post.downvotes}</span>
              </div>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/posts/${post.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeletePost(post.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage forum content and users</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Comments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(posts.map((p) => p.author.id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "posts"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "comments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Comments ({comments.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === "posts" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Posts</h2>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-600">
                No posts found.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => <PostRow key={post.id} post={post} />)
          )}
        </div>
      )}

      {activeTab === "comments" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Comments</h2>
          </div>

          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              Comment management coming soon. For now, you can manage comments
              by visiting individual posts.
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
