"use client";

import { useQueryPosts } from "@/app/_hooks/use-query-posts";
import { PostCallToAction } from "@/app/post-call-to-action";
import { PostsList } from "@/app/posts-list";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@workspace/ui/components/button";
import "highlight.js/styles/github.css";
import { Plus } from "lucide-react";
import Link from "next/link";

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
  const { data: posts = [], isLoading: loading, error } = useQueryPosts();

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
          <Button asChild>
            <Link href="/posts/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Link>
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6">
        <PostsList />
      </div>

      {/* Call to Action for Non-Authenticated Users */}
      <PostCallToAction isVisible={posts.length > 0} />
    </div>
  );
}
