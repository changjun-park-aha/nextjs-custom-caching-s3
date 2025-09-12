"use client";

import { useQueryPosts } from "@/app/_hooks/use-query-posts";
import { CreateFirstPost } from "@/app/create-first-post";
import { PostCard } from "@/app/post-card";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface PostCallToActionProps {
  isVisible: boolean;
}

export function PostCallToAction({ isVisible }: PostCallToActionProps) {
  const { session } = useAuth();

  if (session || !isVisible) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardContent className="pt-6 text-center">
        <div className="py-4">
          <h3 className="text-lg font-medium mb-2">Join the Discussion</h3>
          <p className="text-gray-600 mb-4">
            Sign in to vote on posts, comment, and create your own content.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
