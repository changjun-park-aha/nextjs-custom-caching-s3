'use client';

import { Post } from '@/schemas';
import { useQuery } from '@tanstack/react-query';

// Custom hooks for admin data fetching
export function useQueryAdminPosts(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "posts"],
    queryFn: async (): Promise<Post[]> => {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error("Failed to load posts");
      }
      return response.json();
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled,
  });
}

