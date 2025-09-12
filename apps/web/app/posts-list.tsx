"use client";

import { useQueryPosts } from "@/app/_hooks/use-query-posts";
import { CreateFirstPost } from "@/app/create-first-post";
import { PostCard } from "@/app/post-card";
import { Card, CardContent } from "@workspace/ui/components/card";
import { MessageCircle } from "lucide-react";

export function PostsList() {
  const { data: posts = [], isLoading: loading, error } = useQueryPosts();

  if (posts.length === 0) {
    return (
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
            <CreateFirstPost />
          </div>
        </CardContent>
      </Card>
    );
  }

  return posts.map((post) => <PostCard key={post.id} postId={post.id} />);
}
