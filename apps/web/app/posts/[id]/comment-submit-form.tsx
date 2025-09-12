'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Textarea } from '@workspace/ui/components/textarea'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useMutationCreateComment } from '@/app/_hooks/use-mutation-create-comment'
import { useAuth } from '@/lib/auth-context'
import type { Post } from '@/schemas/posts'

interface CommentSubmitFormProps {
  postId: Post['id']
}

export function CommentSubmitForm({ postId }: CommentSubmitFormProps) {
  const { session } = useAuth()
  const user = session?.user
  const router = useRouter()

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    createCommentMutation.mutate(
      {
        content: newComment,
        postId,
        authorId: user.id,
      },
      {
        onSuccess: () => {
          setNewComment('')
        },
      },
    )
  }

  const createCommentMutation = useMutationCreateComment()

  const [newComment, setNewComment] = useState<string>('')
  const [commentTab, setCommentTab] = useState<string>('write')

  if (!user) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6 text-center">
          <p className="mb-4 text-gray-600">Please sign in to comment</p>
          <Button onClick={() => router.push('/auth/login')}>Sign In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <form onSubmit={handleCommentSubmit}>
          <Tabs
            value={commentTab}
            onValueChange={setCommentTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="mt-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment using Markdown..."
                rows={4}
                className="font-mono"
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-2">
              <div className="min-h-[100px] overflow-auto rounded-md border bg-gray-50 p-3 dark:bg-gray-800">
                {newComment ? (
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {newComment}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Write some content to see the preview here...
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-4">
            <Button
              type="submit"
              disabled={createCommentMutation.isPending || !newComment.trim()}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
