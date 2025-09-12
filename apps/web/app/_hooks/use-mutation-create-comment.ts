'use client';

import type { NewComment } from '@/schemas/comments';
import { useMutation, useQueryClient } from '@tanstack/react-query';


export function useMutationCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      content,
      postId,
      parentId,
    }: NewComment) => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          postId,
          parentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }
      return response.json();
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments to refetch them
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}