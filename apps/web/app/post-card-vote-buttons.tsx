"use client";

import { useMutationVote } from "@/app/_hooks/use-mutation-vote";
import { useAuth } from "@/lib/auth-context";
import { Post } from "@/schemas";
import { Button } from "@workspace/ui/components/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface PostCardVoteButtonsProps {
  post: Post;
}

export function PostCardVoteButtons({ post }: PostCardVoteButtonsProps) {
  const { session } = useAuth();
  const voteMutation = useMutationVote();

  const handleVote = (postId: string, voteType: "upvote" | "downvote") => {
    if (!session) {
      return;
    }

    voteMutation.mutate({
      targetId: postId,
      targetType: "post",
      voteType,
    });
  };

  return (
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
}
