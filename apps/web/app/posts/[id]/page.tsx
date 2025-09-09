"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Reply,
  Trash2,
  Edit,
  User,
} from "lucide-react";

interface Author {
  id: string;
  nickname: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

interface Comment {
  id: string;
  content: string;
  postId: string;
  parentId?: string;
  mentionedUserId?: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export default function PostPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (response.ok) {
        const postData = await response.json();
        setPost(postData);
      } else {
        setError("Post not found");
      }
    } catch (error) {
      setError("Failed to load post");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (
    targetId: string,
    targetType: "post" | "comment",
    voteType: "upvote" | "downvote"
  ) => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId,
          targetType,
          voteType,
        }),
      });

      if (response.ok) {
        // Refresh data to show updated vote counts
        if (targetType === "post") {
          fetchPost();
        } else {
          fetchComments();
        }
      }
    } catch (error) {
      console.error("Failed to vote");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          postId,
        }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
      } else {
        setError("Failed to post comment");
      }
    } catch (error) {
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!session || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          postId,
          parentId,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        fetchComments();
      } else {
        setError("Failed to post reply");
      }
    } catch (error) {
      setError("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const VoteButtons = ({
    targetId,
    targetType,
    upvotes,
    downvotes,
  }: {
    targetId: string;
    targetType: "post" | "comment";
    upvotes: number;
    downvotes: number;
  }) => (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(targetId, targetType, "upvote")}
        className="p-1 h-8 w-8"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-green-600">{upvotes}</span>
      <span className="text-sm font-medium text-red-600">{downvotes}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(targetId, targetType, "downvote")}
        className="p-1 h-8 w-8"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );

  const CommentItem = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => {
    const replies = comments.filter((c) => c.parentId === comment.id);

    return (
      <div
        className={`border-l-2 border-gray-200 ${isReply ? "ml-8 mt-4" : "mt-4"}`}
      >
        <div className="flex space-x-4 p-4">
          <VoteButtons
            targetId={comment.id}
            targetType="comment"
            upvotes={comment.upvotes}
            downvotes={comment.downvotes}
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">{comment.author.nickname}</span>
              <span>•</span>
              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>

            <div className="flex space-x-2">
              {session && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              )}

              {session &&
                (session.user.id === comment.author.id ||
                  session.user.isAdmin) && (
                  <Button variant="ghost" size="sm" className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
            </div>

            {replyingTo === comment.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                />
                <div className="flex space-x-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleReplySubmit(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? "Posting..." : "Post Reply"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
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
          <CommentItem key={reply.id} comment={reply} isReply={true} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div>Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div>Post not found</div>
      </div>
    );
  }

  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Post */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start space-x-4">
            <VoteButtons
              targetId={post.id}
              targetType="post"
              upvotes={post.upvotes}
              downvotes={post.downvotes}
            />

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <User className="h-4 w-4" />
                <span className="font-medium">{post.author.nickname}</span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {session &&
                  (session.user.id === post.author.id ||
                    session.user.isAdmin) && (
                    <>
                      <span>•</span>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* Comment Form */}
      {session ? (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleCommentSubmit}>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={4}
                className="mb-4"
              />
              <Button type="submit" disabled={submitting || !newComment.trim()}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please sign in to comment</p>
            <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <div className="space-y-0">
        <h2 className="text-xl font-bold mb-6">
          Comments ({topLevelComments.length})
        </h2>

        {topLevelComments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              No comments yet. Be the first to comment!
            </CardContent>
          </Card>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
