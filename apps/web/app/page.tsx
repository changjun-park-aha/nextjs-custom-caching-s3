"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  User,
  Plus,
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
  updatedAt: string;
  author: Author;
}

export default function HomePage() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const postsData = await response.json();
        setPosts(postsData);
      } else {
        setError("Failed to load posts");
      }
    } catch (error) {
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (
    postId: string,
    voteType: "upvote" | "downvote"
  ) => {
    if (!session) {
      return;
    }

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: postId,
          targetType: "post",
          voteType,
        }),
      });

      if (response.ok) {
        // Refresh posts to show updated vote counts
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to vote");
    }
  };

  const VoteButtons = ({ post }: { post: Post }) => (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(post.id, "upvote")}
        className="p-1 h-8 w-8"
        disabled={!session}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-green-600">{post.upvotes}</span>
      <span className="text-sm font-medium text-red-600">{post.downvotes}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(post.id, "downvote")}
        className="p-1 h-8 w-8"
        disabled={!session}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );

  const PostCard = ({ post }: { post: Post }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <VoteButtons post={post} />

          <div className="flex-1 min-w-0">
            <Link
              href={`/posts/${post.id}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                {post.title}
              </h2>
            </Link>

            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <User className="h-4 w-4" />
              <span className="font-medium">{post.author.nickname}</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="line-clamp-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    // Limit rendering to simple elements for preview
                    h1: ({ children }) => (
                      <span className="font-bold text-lg">{children}</span>
                    ),
                    h2: ({ children }) => (
                      <span className="font-bold text-base">{children}</span>
                    ),
                    h3: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h4: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h5: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h6: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    blockquote: ({ children }) => (
                      <span className="italic text-gray-600">{children}</span>
                    ),
                    ul: ({ children }) => <span>{children}</span>,
                    ol: ({ children }) => <span>{children}</span>,
                    li: ({ children }) => <span>{children}</span>,
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => <span>{children}</span>,
                  }}
                >
                  {post.content.length > 200
                    ? post.content.slice(0, 200) + "..."
                    : post.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Link href={`/posts/${post.id}`}>
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              View Comments
            </Button>
          </Link>

          <div className="text-sm text-gray-500">
            Score: {post.upvotes - post.downvotes}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div>Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Latest Posts</h1>
          <p className="text-gray-600">
            Discover and discuss topics with the community
          </p>
        </div>

        {session && (
          <Link href="/posts/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Be the first to start a discussion!
                </p>
                {session ? (
                  <Link href="/posts/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Post
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/login">
                    <Button>Sign In to Create Post</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Call to Action for Non-Authenticated Users */}
      {!session && posts.length > 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6 text-center">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-2">Join the Discussion</h3>
              <p className="text-gray-600 mb-4">
                Sign in to vote on posts, comment, and create your own content.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/login">
                  <Button>Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
