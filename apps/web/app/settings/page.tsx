"use client";

import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { User, Lock, Shield } from "lucide-react";

export default function SettingsPage() {
  const { session, status, refresh } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState(session?.user?.nickname || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div>Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleNicknameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!nickname.trim()) {
      setError("Nickname cannot be empty");
      setIsLoading(false);
      return;
    }

    if (nickname.length > 100) {
      setError("Nickname must be less than 100 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update-nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
        }),
      });

      if (response.ok) {
        setSuccess("Nickname updated successfully");
        // Update the session
        await refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update nickname");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and security settings.
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Settings</span>
            </CardTitle>
            <CardDescription>
              Update your public profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNicknameUpdate} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Email address cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Display Name</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNickname(e.target.value)
                  }
                  placeholder="Enter your display name"
                  disabled={isLoading}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  This is how your name will appear to other users (
                  {nickname.length}/100)
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  isLoading || nickname.trim() === session?.user?.nickname
                }
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>
              Manage your account security and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-gray-600">
                    Change your account password
                  </p>
                </div>
                <Link href="/settings/password">
                  <Button variant="outline">Change Password</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Account Type:</span>
                <span className="text-sm font-medium">
                  {session?.user?.isAdmin ? "Administrator" : "Regular User"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Member Since:</span>
                <span className="text-sm">
                  {new Date().toLocaleDateString()}{" "}
                  {/* This would come from user creation date */}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Panel Access */}
        {session?.user?.isAdmin && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">
                Administrator Access
              </CardTitle>
              <CardDescription>
                You have administrative privileges for content management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700"
                >
                  Access Admin Panel
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
