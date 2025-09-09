"use client";

// This file is no longer needed as we've replaced NextAuth.js with custom authentication
// The AuthProvider from auth-context.tsx is now used instead
export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
