"use client";

import { useQueryAdminComments } from "@/app/_hooks/use-query-admin-comments";
import { useQueryAdminPosts } from "@/app/_hooks/use-query-admin-posts";
import { useMutationDeleteComment } from "@/app/_hooks/use-mutation-delete-comment";
import { useMutationDeletePost } from "@/app/_hooks/use-mutation-delete-post";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PostRow } from "./post-row";

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
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts");

  const isAdmin = status === "authenticated" && !!session?.user?.isAdmin;

  // React Query hooks
  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
  } = useQueryAdminPosts(isAdmin);
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
  } = useQueryAdminComments(isAdmin);
  const deletePostMutation = useMutationDeletePost();
  const deleteCommentMutation = useMutationDeleteComment();

  const loading = postsLoading || commentsLoading;
  const error = postsError || commentsError;

  // Redirect non-admin users
  if (
    status === "unauthenticated" ||
    (status === "authenticated" && !session?.user?.isAdmin)
  ) {
    router.push("/");
    return null;
  }

  const handleDeletePost = (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    deletePostMutation.mutate(postId);
  };

  const handleDeleteComment = (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    deleteCommentMutation.mutate(commentId);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage forum content and users</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {error instanceof Error ? error.message : "An error occurred"}
          </AlertDescription>
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
              {new Set(posts.map((p) => p.authorId)).size}
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
            type="button"
          >
            Posts ({posts.length})
          </button>
          <button
            type="button"
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
            posts.map((post) => <PostRow key={post.id} postId={post.id} />)
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
