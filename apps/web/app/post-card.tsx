"use client";

import type { Post } from "@/schemas/posts";
import { useQueryPost } from "./_hooks/use-query-post";
import { Button } from "@workspace/ui/components/button";
import { Card, CardHeader, CardContent } from "@workspace/ui/components/card";
import { User, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { VoteButtons } from "./posts/[id]/vote-buttons";
import { useQueryUser } from "@/app/_hooks/use-query-user";
import Link from "next/link";

interface PostCardProps {
  postId: Post["id"];
}

export function PostCard({ postId }: PostCardProps) {
  const { data: post } = useQueryPost(postId);
  const { data: author } = useQueryUser(post?.authorId || "");

  if (!post) {
    return null;
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          <VoteButtons
            targetId={postId}
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            targetType="post"
          />

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
              <span className="font-medium">{author?.nickname}</span>
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
}
