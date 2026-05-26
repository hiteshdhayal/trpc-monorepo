"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function FormSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F5F0E8] px-4 relative overflow-hidden text-[#1A1008] selection:bg-[rgba(196,30,58,0.15)] selection:text-[#1A1008]">
      <Card className="w-full max-w-md border-[#D4C9B0] bg-[#FAF7F2] shadow-none relative z-10 text-center">
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-[rgba(196,30,58,0.06)] rounded-2xl border border-[#C41E3A]/20 text-[#C41E3A]">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-bold text-[#1A1008] tracking-tight">Submission Received!</h1>
            <p className="text-sm text-[#6B5744]">
              Your response has been securely transmitted and recorded in the database. Thank you for your time.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push(`/forms/${formId}`)}
              variant="outline"
              className="border-[#D4C9B0] bg-[#FAF7F2] text-[#6B5744] hover:bg-[#EDE8DC] hover:text-[#1A1008] font-medium cursor-pointer shadow-none"
            >
              Fill Again
            </Button>
            <Button
              onClick={() => router.push("/auth/login")}
              className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium cursor-pointer shadow-none flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Build Your Own Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
