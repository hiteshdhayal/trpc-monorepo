"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Check,
  X,
  Zap,
  Sparkles,
  ArrowRight,
  CreditCard,
  Lock,
  ShieldCheck,
  Star,
  ChevronLeft,
  Building2,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";

const FREE_FEATURES = [
  { label: "Up to 3 forms", included: true },
  { label: "All 8 field types", included: true },
  { label: "Draft / Published / Closed states", included: true },
  { label: "Custom themes (Startup, Hogwarts, Cyberpunk)", included: true },
  { label: "Analytics dashboard (funnel + charts)", included: true },
  { label: "100 responses / month", included: true },
  { label: "CSV export", included: true },
  { label: "Honeypot spam protection", included: true },
  { label: "Custom URL slugs", included: false },
  { label: "QR code sharing", included: false },
  { label: "Conditional logic (skip logic)", included: false },
  { label: "Email notifications (Resend)", included: false },
  { label: "Unlimited forms & responses", included: false },
  { label: "Priority support", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited forms", included: true },
  { label: "All 8 field types", included: true },
  { label: "Draft / Published / Closed states", included: true },
  { label: "Custom themes (Startup, Hogwarts, Cyberpunk)", included: true },
  { label: "Analytics dashboard (funnel + charts)", included: true },
  { label: "Unlimited responses", included: true },
  { label: "CSV export", included: true },
  { label: "Honeypot spam protection", included: true },
  { label: "Custom URL slugs", included: true },
  { label: "QR code sharing", included: true },
  { label: "Conditional logic (skip logic)", included: true },
  { label: "Email notifications (Resend)", included: true },
  { label: "Unlimited forms & responses", included: true },
  { label: "Priority support", included: true },
];

const ENTERPRISE_FEATURES = [
  { label: "Everything in Pro" },
  { label: "Single Sign-On (SSO / SAML 2.0)" },
  { label: "99.9% uptime SLA" },
  { label: "Dedicated account manager" },
  { label: "Custom contract & invoicing" },
  { label: "On-premise deployment option" },
  { label: "Advanced audit logs & compliance" },
  { label: "Custom form themes & white-labelling" },
  { label: "Unlimited team seats" },
  { label: "24 / 7 priority phone & email support" },
];

function CheckoutModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"plan" | "payment" | "success">("plan");
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [isProcessing, setIsProcessing] = useState(false);

  const price = billing === "annual" ? 9 : 12;

  const handleCheckout = async () => {
    setIsProcessing(true);
    // Simulate Stripe checkout processing
    await new Promise((r) => setTimeout(r, 1800));
    setIsProcessing(false);
    setStep("success");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(26,16,8,0.45)] backdrop-blur-[4px] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[#FAF7F2] border border-[#D4C9B0] rounded-[6px] shadow-[0_16px_64px_rgba(26,16,8,0.15)] overflow-hidden">
        {step === "plan" && (
          <div>
            <div className="p-6 border-b border-[#D4C9B0]/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1A1008]">Upgrade to Pro</h2>
                  <p className="text-xs text-[#6B5744] mt-0.5">
                    Unlock the full FinalForms experience
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#6B5744] hover:text-[#C41E3A] p-1 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-2 p-1 bg-[#EDE8DC] rounded-[3px] border border-[#D4C9B0]">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`flex-1 py-1.5 rounded-[3px] text-xs font-medium transition-all cursor-pointer ${billing === "monthly" ? "bg-[#FAF7F2] text-[#1A1008] border border-[#D4C9B0]/20" : "text-[#6B5744] hover:text-[#1A1008]"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`flex-1 py-1.5 rounded-[3px] text-xs font-medium transition-all cursor-pointer relative ${billing === "annual" ? "bg-[#C41E3A] text-white" : "text-[#6B5744] hover:text-[#1A1008]"}`}
                >
                  Annual
                  {billing === "annual" && (
                    <span className="absolute -top-2 -right-1 text-[8px] font-bold bg-[#C41E3A] text-white px-1.5 py-0.5 rounded-full border border-[#FAF7F2]">
                      -25%
                    </span>
                  )}
                </button>
              </div>

              {/* Pricing display */}
              <div className="text-center py-2">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-serif font-extrabold text-[#1A1008]">
                    ${price}
                  </span>
                  <span className="text-[#6B5744] text-sm mb-1.5">/month</span>
                </div>
                {billing === "annual" && (
                  <p className="text-xs text-emerald-700 mt-1">
                    Billed annually (${price * 12}/year) — save ${(12 - price) * 12}/year
                  </p>
                )}
              </div>

              {/* Key features */}
              <div className="space-y-2">
                {[
                  "Unlimited forms & responses",
                  "Conditional logic engine",
                  "Email notifications",
                  "QR code sharing",
                  "Priority support",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[#6B5744]">
                    <Check className="h-4 w-4 text-[#C41E3A] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <Button onClick={() => setStep("payment")} className="w-full">
                Continue to Payment
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-center text-[10px] text-[#A89880]">
                Cancel anytime. No questions asked.
              </p>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div>
            <div className="p-6 border-b border-[#D4C9B0]/50 flex items-center gap-3">
              <button
                onClick={() => setStep("plan")}
                className="text-[#6B5744] hover:text-[#1A1008] cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1A1008]">Payment Details</h2>
                <p className="text-xs text-[#6B5744]">Secured by Stripe</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3 bg-[rgba(196,30,58,0.04)] border border-[rgba(196,30,58,0.2)] rounded-[3px] flex items-center gap-3">
                <Zap className="h-5 w-5 text-[#C41E3A] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1A1008]">
                    Pro Plan — {billing === "annual" ? "Annual" : "Monthly"}
                  </p>
                  <p className="text-xs text-[#6B5744]">
                    ${price}/month billed {billing}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6B5744] block mb-1.5 font-medium">
                    Card number
                  </label>
                  <div className="h-11 bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] px-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#A89880]" />
                    <span className="text-[#6B5744] text-sm font-mono">4242 4242 4242 4242</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6B5744] block mb-1.5 font-medium">
                      Expiry
                    </label>
                    <div className="h-11 bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] px-3 flex items-center">
                      <span className="text-[#6B5744] text-sm font-mono">12/28</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#6B5744] block mb-1.5 font-medium">CVC</label>
                    <div className="h-11 bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] px-3 flex items-center">
                      <span className="text-[#6B5744] text-sm font-mono">•••</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleCheckout} disabled={isProcessing} className="w-full">
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay ${price}/month
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#A89880]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                256-bit SSL encryption · Stripe PCI compliant
              </div>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="p-5 bg-[rgba(74,124,89,0.08)] border border-[rgba(74,124,89,0.3)] rounded-[3px] text-[#2D5A3D]">
                <Sparkles className="h-12 w-12" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-extrabold text-[#1A1008]">
                Welcome to Pro! 🎉
              </h2>
              <p className="text-sm text-[#6B5744]">
                Your account has been upgraded. Conditional logic, email notifications, and QR codes
                are now unlocked.
              </p>
            </div>
            <Button
              onClick={() => {
                onClose();
                toast.success("Pro plan activated! Enjoy unlimited forms.");
              }}
              className="w-full"
            >
              Start Building →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [showCheckout, setShowCheckout] = useState(false);

  const proPrice = billing === "annual" ? 9 : 12;

  return (
    <>
      <main className="min-h-screen bg-[#F5F0E8] text-[#1A1008] selection:bg-[rgba(196,30,58,0.15)] selection:text-[#1A1008] overflow-hidden relative">
        {/* Background dot matrix */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,#D4C9B0_1px,transparent_1px] bg-[size:24px_24px] opacity-15 pointer-events-none" />

        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-[#D4C9B0] relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[3px] bg-[#C41E3A] flex items-center justify-center font-bold text-white shadow-sm shadow-[#C41E3A]/20 font-serif">
              F
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1A1008] font-serif">
              FinalForms
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-xs">
                Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 pt-20 pb-12 text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[rgba(196,30,58,0.06)] border border-[rgba(196,30,58,0.15)] rounded-full text-[#C41E3A] text-[11px] uppercase tracking-wider font-semibold">
            <Zap className="h-3 w-3" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight leading-tight">
            Start free.
            <span className="block text-[#C41E3A] mt-1">Scale with Pro.</span>
          </h1>
          <p className="text-[#6B5744] text-sm sm:text-base max-w-xl mx-auto">
            Everything you need to build beautiful conversational forms — no credit card required to
            start.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-2 p-1 bg-[#EDE8DC] border border-[#D4C9B0] rounded-[3px] w-fit mx-auto mt-2">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-[3px] text-xs font-medium transition-all cursor-pointer ${billing === "monthly" ? "bg-[#FAF7F2] text-[#1A1008] border border-[#D4C9B0]/30 shadow-xs" : "text-[#6B5744] hover:text-[#1A1008]"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-5 py-2 rounded-[3px] text-xs font-medium transition-all cursor-pointer relative ${billing === "annual" ? "bg-[#C41E3A] text-[#FAF7F2]" : "text-[#6B5744] hover:text-[#1A1008]"}`}
            >
              Annual
              <span className="ml-2 text-[9px] font-bold bg-[#FAF7F2] text-[#C41E3A] px-1.5 py-0.5 rounded-full border border-[#C41E3A]">
                SAVE 25%
              </span>
            </button>
          </div>
        </section>

        {/* Plans */}
        <section className="max-w-5xl mx-auto px-4 pb-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Free Plan */}
            <div className="p-8 rounded-[4px] border border-[#D4C9B0] bg-[#FAF7F2] space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-serif font-bold text-[#1A1008]">Free</h2>
                <p className="text-xs text-[#6B5744]">For individuals just getting started</p>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-4xl font-extrabold text-[#1A1008] font-serif">$0</span>
                  <span className="text-[#6B5744] text-sm mb-1.5">/month</span>
                </div>
              </div>

              <Link href="/auth/register">
                <Button variant="outline" className="w-full">
                  Get Started Free
                </Button>
              </Link>

              <div className="space-y-3 pt-2">
                {FREE_FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className={`flex items-center gap-2.5 text-sm ${f.included ? "text-[#6B5744]" : "text-[#A89880] line-through decoration-[#D4C9B0]"}`}
                  >
                    {f.included ? (
                      <Check className="h-4 w-4 text-[#C41E3A] shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-[#A89880] shrink-0" />
                    )}
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-[4px] border-2 border-[#C41E3A] bg-[#FAF7F2] shadow-[0_16px_48px_rgba(196,30,58,0.06)] space-y-6 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#C41E3A] text-white border-none px-3 py-1 text-[10px] font-semibold flex items-center gap-1 shadow-md shadow-[#C41E3A]/20">
                  <Star className="h-3 w-3 fill-white" />
                  Most Popular
                </Badge>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-serif font-bold text-[#1A1008]">Pro</h2>
                <p className="text-xs text-[#6B5744]">For teams and power users</p>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-4xl font-extrabold text-[#1A1008] font-serif">
                    ${proPrice}
                  </span>
                  <span className="text-[#6B5744] text-sm mb-1.5">/month</span>
                </div>
                {billing === "annual" && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    Billed ${proPrice * 12}/year — saving $36/year
                  </p>
                )}
              </div>

              <Button onClick={() => setShowCheckout(true)} className="w-full">
                <Zap className="h-4 w-4" />
                Upgrade to Pro
              </Button>

              <div className="space-y-3 pt-2">
                {PRO_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 text-sm text-[#1A1008]">
                    <Check className="h-4 w-4 text-[#C41E3A] shrink-0" />
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 rounded-[4px] border border-[#1A1008] bg-[#1A1008] space-y-6 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#1A1008] text-[#D4C9B0] border border-[#D4C9B0]/30 px-3 py-1 text-[10px] font-semibold flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Enterprise
                </Badge>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-serif font-bold text-[#FAF7F2]">Enterprise</h2>
                <p className="text-xs text-[#A89880]">For large teams & regulated industries</p>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-4xl font-extrabold text-[#FAF7F2] font-serif">Custom</span>
                </div>
                <p className="text-xs text-[#A89880] mt-1">
                  Tailored pricing based on seats & usage
                </p>
              </div>

              <a href="mailto:enterprise@finalforms.com">
                <Button className="w-full bg-[#C41E3A] hover:bg-[#8B1A2A] text-white border-none shadow-none font-semibold">
                  <PhoneCall className="h-4 w-4" />
                  Contact Sales
                </Button>
              </a>

              <div className="space-y-3 pt-2">
                {ENTERPRISE_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 text-sm text-[#D4C9B0]">
                    <Check className="h-4 w-4 text-[#C41E3A] shrink-0" />
                    {f.label}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#6B5744] pt-2 border-t border-[#D4C9B0]/10">
                Includes custom MSA, BAA for HIPAA, and SOC 2 report on request.
              </p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "FinalForms replaced Typeform for our entire startup. The analytics are incredible.",
                name: "Arjun Mehta",
                role: "Founder, Growthly",
              },
              {
                quote:
                  "The Hogwarts theme got us 3x more responses for our student onboarding form.",
                name: "Priya Sharma",
                role: "Student Success, IIT Bombay",
              },
              {
                quote: "Conditional logic + email notifications is everything. Worth every rupee.",
                name: "Rahul Verma",
                role: "Product Lead, Zomato",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-[4px] border border-[#D4C9B0] bg-[#FAF7F2]/50 space-y-4"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-[#C41E3A] fill-[#C41E3A]" />
                  ))}
                </div>
                <p className="text-sm text-[#6B5744] leading-relaxed italic">"{t.quote}"</p>
                <div>
                  <p className="text-xs font-bold text-[#1A1008]">{t.name}</p>
                  <p className="text-[10px] text-[#A89880]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-serif font-bold text-center mb-8 text-[#1A1008]">
              Frequently Asked Questions
            </h2>
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel your Pro subscription at any time with a single click. No questions, no hoops.",
              },
              {
                q: "What payment methods are supported?",
                a: "All major credit/debit cards (Visa, Mastercard, Amex) and UPI via Stripe.",
              },
              {
                q: "What is conditional logic?",
                a: 'Show or hide questions based on previous answers — e.g., only show "Which Hogwarts house?" if the respondent answers "Yes" to being a wizard.',
              },
              {
                q: "Do responses from the Free plan count against my quota?",
                a: "Yes, Free is capped at 100 completed responses per month per form. Pro removes all limits.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="p-5 rounded-[4px] border border-[#D4C9B0] bg-[#FAF7F2] space-y-2"
              >
                <p className="font-serif font-bold text-[#1A1008] text-sm">{item.q}</p>
                <p className="text-xs text-[#6B5744] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#D4C9B0] py-6 text-center text-xs text-[#A89880] bg-[#EDE8DC]/30">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C41E3A]" />
            Payments secured by Stripe · © 2026 FinalForms Inc.
          </div>
        </footer>
      </main>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </>
  );
}
