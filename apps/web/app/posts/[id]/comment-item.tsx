'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Textarea } from '@workspace/ui/components/textarea'
import { Reply, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useMutationCreateComment } from '@/app/_hooks/use-mutation-create-comment'
import { useQueryComments } from '@/app/_hooks/use-query-comments'
import { useQueryUser } from '@/app/_hooks/use-query-user'
import { useAuth } from '@/lib/auth-context'
import type { Post } from '@/schemas'
import type { Comment } from '@/schemas/comments'
import { VoteButtons } from './vote-buttons'

interface CommentItemProps {
  postId: Post['id']
  comment: Comment
  isReply?: boolean
}

export function CommentItem({
  postId,
  comment,
  isReply = false,
}: CommentItemProps) {
  const { session } = useAuth()
  const user = session?.user

  const { data: comments = [] } = useQueryComments(postId)
  const { data: author } = useQueryUser(comment.authorId)
  const createCommentMutation = useMutationCreateComment()

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyTab, setReplyTab] = useState<{ [key: string]: string }>({})
  const [replyContent, setReplyContent] = useState<string>('')

  const handleReplySubmit = (parentId: string) => {
    if (!user || !replyContent.trim()) return

    createCommentMutation.mutate(
      {
        content: replyContent,
        postId,
        parentId,
        authorId: user.id,
      },
      {
        onSuccess: () => {
          setReplyContent('')
          setReplyingTo(null)
        },
      },
    )
  }

  const replies = comments.filter((c) => c.parentId === comment.id)

  return (
    <div
      className={`border-gray-200 border-l-2 ${isReply ? 'mt-4 ml-8' : 'mt-4'}`}
    >
      <div className="flex space-x-4 p-4">
        <VoteButtons
          targetId={comment.id}
          targetType="comment"
          upvotes={comment.upvotes}
          downvotes={comment.downvotes}
        />

        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <User className="h-4 w-4" />
            <span className="font-medium">{author?.nickname}</span>
            <span>•</span>
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {comment.content}
            </ReactMarkdown>
          </div>

          <div className="flex space-x-2">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
              >
                <Reply className="mr-2 h-4 w-4" />
                Reply
              </Button>
            )}

            {user && (user.id === author?.id || user.isAdmin) && (
              <Button variant="ghost" size="sm" className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <Tabs
                value={replyTab[comment.id] || 'write'}
                onValueChange={(value) =>
                  setReplyTab({ ...replyTab, [comment.id]: value })
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="mt-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply using Markdown..."
                    rows={3}
                    className="font-mono"
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-2">
                  <div className="min-h-[80px] rounded-md border bg-white p-3">
                    {replyContent ? (
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {replyContent}
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

              <div className="mt-2 flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleReplySubmit(comment.id)}
                  disabled={
                    createCommentMutation.isPending || !replyContent.trim()
                  }
                >
                  {createCommentMutation.isPending
                    ? 'Posting...'
                    : 'Post Reply'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyContent('')
                    setReplyTab({ ...replyTab, [comment.id]: 'write' })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render replies */}
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          isReply={true}
          postId={postId}
        />
      ))}
    </div>
  )
}
