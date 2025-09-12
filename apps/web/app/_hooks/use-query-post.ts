'use client';

import type { Post } from '@/schemas';
import { useQuery } from '@tanstack/react-query';

export function useQueryPost(postId: string) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async (): Promise<Post> => {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) {
        throw new Error("Post not found");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!postId,
  });
}