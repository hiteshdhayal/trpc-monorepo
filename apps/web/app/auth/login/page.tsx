"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { env } from "~/env.js";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
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
              <Label
                htmlFor="email"
                className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold"
              >
                Email Address
              </Label>
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
              <Label
                htmlFor="password"
                className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold"
              >
                Password
              </Label>
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

            <Button type="submit" className="w-full mt-2" disabled={loginMutation.isPending}>
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

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-[#D4C9B0]/50"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#A89880] uppercase tracking-wider font-semibold">Or</span>
            <div className="flex-grow border-t border-[#D4C9B0]/50"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-[#D4C9B0] hover:bg-[#EDE8DC] bg-[#FAF7F2] text-[#1A1008] flex items-center justify-center gap-2.5 font-medium rounded-lg py-2.5 shadow-sm transition-colors duration-200 cursor-pointer"
            onClick={() => {
              const apiBaseUrl =
                env.NEXT_PUBLIC_API_BASE_URL ||
                (env.NEXT_PUBLIC_API_URL || "").replace(/\/trpc$/, "");
              window.location.href = `${apiBaseUrl}/auth/google`;
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.47c0,-0.64 -0.06,-1.25 -0.17,-1.8l0,0Z" fill="#4285F4" />
                <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.9,0.6 -2.08,0.98 -3.3,0.98c-2.34,0 -4.33,-1.58 -5.04,-3.7H2.9v2.66c1.48,2.94 4.54,4.94 8.1,4.94Z" fill="#34A853" />
                <path d="M6.96,13.12a5.2,5.2 0 0,1 0,-3.24V7.22H2.9a8.97,8.97 0 0,0 0,7.96l4.06,-3.06Z" fill="#FBBC05" />
                <path d="M12,7.38c1.32,0 2.5,0.46 3.44,1.35l2.58,-2.58C16.46,4.72 14.43,3.92 12,3.92c-3.56,0 -6.62,2 -8.1,4.94l4.06,3.06c0.7,-2.12 2.7,-3.7 5.04,-3.7Z" fill="#EA4335" />
              </g>
            </svg>
            Continue with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center mt-6 p-0 border-t border-[#D4C9B0]/50 pt-4">
          <div className="text-xs text-[#6B5744]">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-[#C41E3A] hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="text-xs text-[#6B5744]">
            <Link
              href="/auth/forgot-password"
              className="text-[#C41E3A] hover:underline font-medium"
            >
              Forgot your password?
            </Link>
          </div>
          <div className="text-[10px] text-[#A89880] w-full">
            Demo credentials: <span className="font-mono text-[#6B5744]">admin@finalforms.com</span>{" "}
            / <span className="font-mono text-[#6B5744]">password123</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
