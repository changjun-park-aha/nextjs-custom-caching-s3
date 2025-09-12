'use client';

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useMutationCreatePost() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  return useMutation({
    mutationFn: async ({
      title,
      content,
    }: {
      title: string;
      content: string;
    }) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create post");
      }

      return response.json();
    },
    onSuccess: (newPost) => {
      // Invalidate posts cache so home page will refetch
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Navigate to the new post
      router.push(`/posts/${newPost.id}`);
    },
  });
}