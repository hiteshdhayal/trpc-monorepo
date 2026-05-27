"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err.message || "Invalid or expired verification link.");
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token found in the link.");
      return;
    }

    // Only run once
    verifyMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-[400px] border-[#D4C9B0] bg-[#FAF7F2] rounded-[6px] p-10 shadow-[0_16px_64px_rgba(26,16,8,0.08)] relative z-10 text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2 className="h-10 w-10 text-[#6B5744] animate-spin mb-4" />
          <h2 className="text-xl font-bold font-serif text-[#1A1008] mb-2">Verifying Email...</h2>
          <p className="text-sm text-[#6B5744]">Please wait while we confirm your email address.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(34,197,94,0.1)] border border-green-200 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#1A1008] mb-3">Email Verified!</h2>
          <p className="text-sm text-[#6B5744] mb-6 leading-relaxed">
            Your email has been successfully verified. You can now log in to your account.
          </p>
          <Link href="/auth/login" className="w-full">
            <Button className="w-full">Proceed to Login</Button>
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(220,38,38,0.1)] border border-red-200 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-[#C41E3A]" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#1A1008] mb-3">Verification Failed</h2>
          <p className="text-sm text-[#6B5744] mb-6 leading-relaxed">{errorMessage}</p>
          <div className="flex flex-col space-y-3 w-full">
            <Link href="/auth/register" className="w-full">
              <Button className="w-full">Create a New Account</Button>
            </Link>
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full border-[#D4C9B0]">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4 relative overflow-hidden">
      {/* Background dot matrix */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,#D4C9B0_1px,transparent_1px] bg-[size:24px_24px] opacity-20 pointer-events-none" />
      <Suspense fallback={<div className="text-[#6B5744] text-sm">Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
