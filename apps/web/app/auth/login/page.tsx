"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { setSessionToken } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setSessionToken(data.token);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Invalid credentials. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 relative overflow-hidden">
      {/* Background dot matrix */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,#D4C9B0_1px,transparent_1px] bg-[size:24px_24px] opacity-20 pointer-events-none" />

      <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10">
        <CardHeader className="space-y-1 text-center relative pb-4 p-0">
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
            <span className="font-serif text-[64px] font-bold text-[#C41E3A] opacity-15">入</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1008] font-serif relative z-10">
            Log In
          </CardTitle>
          <CardDescription className="text-[#6B5744] text-xs relative z-10">
            Enter your credentials to access your forms dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A89880]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A89880]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center mt-6 p-0 border-t border-[#D4C9B0]/50 pt-4">
          <div className="text-xs text-[#6B5744]">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-[#C41E3A] hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
          <div className="text-[10px] text-[#A89880] w-full">
            Demo credentials: <span className="font-mono text-[#6B5744]">admin@finalforms.com</span> /{" "}
            <span className="font-mono text-[#6B5744]">password123</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
