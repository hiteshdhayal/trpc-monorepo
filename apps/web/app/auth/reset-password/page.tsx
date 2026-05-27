"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const colors = ["#C41E3A", "#F97316", "#EAB308", "#84CC16", "#22C55E"];
  const color = colors[Math.min(passed - 1, 4)] ?? "#C41E3A";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < passed ? color : "#D4C9B0" }}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.label}
              className={`text-[10px] flex items-center gap-1.5 ${ok ? "text-green-600" : "text-[#A89880]"}`}
            >
              <span>{ok ? "✓" : "○"}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset password. The link may have expired.");
    },
  });

  if (!token) {
    return (
      <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10 text-center">
        <p className="text-[#C41E3A] font-semibold mb-4">Invalid reset link</p>
        <p className="text-sm text-[#6B5744] mb-6">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link href="/auth/forgot-password">
          <Button className="w-full">Request New Link</Button>
        </Link>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.1)] border border-green-200 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-xl font-bold font-serif text-[#1A1008] mb-3">Password Reset!</h2>
        <p className="text-sm text-[#6B5744] mb-2">
          Your password has been updated successfully.
        </p>
        <p className="text-xs text-[#A89880]">Redirecting to login...</p>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    const allPassed = PASSWORD_RULES.every((r) => r.test(newPassword));
    if (!allPassed) {
      toast.error("Password does not meet strength requirements.");
      return;
    }
    resetMutation.mutate({ token, newPassword });
  };

  return (
    <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10">
      <CardHeader className="space-y-1 text-center relative pb-4 p-0">
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
          <span className="font-serif text-[64px] font-bold text-[#C41E3A] opacity-15">錠</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-[#1A1008] font-serif relative z-10">
          Set New Password
        </CardTitle>
        <CardDescription className="text-[#6B5744] text-xs relative z-10">
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold"
            >
              New Password
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A89880]" />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetMutation.isPending}
                required
              />
              <button
                type="button"
                className="absolute right-3.5 top-3.5 text-[#A89880] hover:text-[#6B5744]"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A89880]" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={resetMutation.isPending}
                required
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-[#C41E3A] mt-1">Passwords do not match</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-center mt-6 p-0 border-t border-[#D4C9B0]/50 pt-4">
        <div className="text-xs text-[#6B5744]">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-[#C41E3A] hover:underline font-medium">
            Log in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 relative overflow-hidden">
      {/* Background dot matrix */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,#D4C9B0_1px,transparent_1px] bg-[size:24px_24px] opacity-20 pointer-events-none" />
      <Suspense fallback={<div className="text-[#6B5744] text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
