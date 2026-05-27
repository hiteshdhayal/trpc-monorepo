"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      // Always show the same success message regardless of whether email exists
      // This prevents user enumeration on the frontend too
      setSubmitted(true);
    },
    onError: () => {
      // Show generic error — don't leak details
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    forgotMutation.mutate({ email });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[circle_at_center,#D4C9B0_1px,transparent_1px] bg-[size:24px_24px] opacity-20 pointer-events-none" />
        <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.1)] border border-green-200 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-serif text-[#1A1008] mb-3">Check your inbox</h2>
          <p className="text-sm text-[#6B5744] mb-6 leading-relaxed">
            If an account exists for <strong className="text-[#1A1008]">{email}</strong>, a
            password reset link has been sent. The link expires in <strong>15 minutes</strong>.
          </p>
          <p className="text-xs text-[#A89880] mb-6">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              className="text-[#C41E3A] hover:underline"
              onClick={() => setSubmitted(false)}
            >
              try again
            </button>
            .
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full border-[#D4C9B0]">
              Back to Login
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 relative overflow-hidden">
      {/* Background dot matrix */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,#D4C9B0_1px,transparent_1px] bg-[size:24px_24px] opacity-20 pointer-events-none" />

      <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10">
        <CardHeader className="space-y-1 text-center relative pb-4 p-0">
          <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
            <span className="font-serif text-[64px] font-bold text-[#C41E3A] opacity-15">忘</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1008] font-serif relative z-10">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-[#6B5744] text-xs relative z-10">
            Enter your email and we&apos;ll send you a reset link
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
                  disabled={forgotMutation.isPending}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={forgotMutation.isPending}>
              {forgotMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center mt-6 p-0 border-t border-[#D4C9B0]/50 pt-4">
          <div className="text-xs text-[#6B5744]">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-[#C41E3A] hover:underline font-medium">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
