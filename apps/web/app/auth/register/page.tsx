"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { setSessionToken } from "~/lib/auth";
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
import { Loader2, KeyRound, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setSessionToken(data.token);
      toast.success(`Welcome to FinalForms, ${data.user.fullName}!`);
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    registerMutation.mutate({ fullName, email, password });
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
            Sign Up
          </CardTitle>
          <CardDescription className="text-[#6B5744] text-xs relative z-10">
            Sign up to build beautiful, conversational forms in minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold"
              >
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A89880]" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={registerMutation.isPending}
                  required
                />
              </div>
            </div>
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
                  disabled={registerMutation.isPending}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[#6B5744] text-xs uppercase tracking-wider font-semibold"
              >
                Password (min. 6 chars)
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
                  disabled={registerMutation.isPending}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-center mt-6 p-0 border-t border-[#D4C9B0]/50 pt-4">
          <div className="text-xs text-[#6B5744]">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#C41E3A] hover:underline font-medium">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
