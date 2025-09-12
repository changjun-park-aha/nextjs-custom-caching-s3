'use client'

import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { Textarea } from '@workspace/ui/components/textarea'
import { useMutationCreatePost } from '@/app/_hooks/use-mutation-create-post'
import 'highlight.js/styles/github.css'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { useAuth } from '@/lib/auth-context'

export default function CreatePostPage() {
  const { status } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState('write')

  const createPostMutation = useMutationCreatePost()

  if (status === 'loading') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div>Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      return
    }

    createPostMutation.mutate({
      title,
      content,
    })
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
          <CardDescription>
            Share your thoughts with the community using Markdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {createPostMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {createPostMutation.error instanceof Error
                    ? createPostMutation.error.message
                    : 'An error occurred. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                required
                placeholder="Enter your post title"
                disabled={createPostMutation.isPending}
                maxLength={255}
              />
              <p className="text-gray-500 text-sm">
                {title.length}/255 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="write" className="mt-2">
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setContent(e.target.value)
                    }
                    required
                    placeholder="Write your post content here using Markdown...

**Bold text**, *italic text*

# Heading 1
## Heading 2

- Bullet point
1. Numbered list

[Link text](https://example.com)

```javascript
// Code block
console.log('Hello, world!');
```

> Blockquote"
                    disabled={createPostMutation.isPending}
                    rows={15}
                    className="resize-none font-mono"
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-2">
                  <div className="min-h-[380px] overflow-auto rounded-md border bg-gray-50 p-3 dark:bg-gray-800">
                    {content ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                        >
                          {content}
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

              <p className="text-gray-500 text-sm">
                {content.length} characters • Supports Markdown formatting
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={
                  createPostMutation.isPending ||
                  !title.trim() ||
                  !content.trim()
                }
                className="flex-1"
              >
                {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createPostMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
