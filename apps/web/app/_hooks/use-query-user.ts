import { useQuery } from '@tanstack/react-query'
import type { User } from '@/schemas/users'

export function useQueryUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<User> => {
      const response = await fetch(`/api/user/${userId}`)
      if (!response.ok) {
        throw new Error('User not found')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  })
}
