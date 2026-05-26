"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ShieldCheck, BarChart3, Palette } from "lucide-react";

function FormGlassDemo() {
  const [nameText, setNameText] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Typing animation for Field 1
  useEffect(() => {
    const name = "Hiroshi Tanaka";
    let idx = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setNameText(name.substring(0, idx + 1));
        idx++;
        if (idx >= name.length) {
          clearInterval(interval);
        }
      }, 80);
      return () => clearInterval(interval);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  // Dropdown open/close cycle for Field 3
  useEffect(() => {
    const triggerDropdownCycle = () => {
      const openTimer = setTimeout(() => {
        setDropdownOpen(true);
      }, 3500);

      const closeTimer = setTimeout(() => {
        setDropdownOpen(false);
      }, 5000);

      return { openTimer, closeTimer };
    };

    let timers = triggerDropdownCycle();

    const interval = setInterval(() => {
      timers = triggerDropdownCycle();
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timers.openTimer);
      clearTimeout(timers.closeTimer);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* Floating Badges */}
      <div className="absolute top-[-16px] left-[-24px] z-20 bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] p-[6px_12px] text-[11px] text-[#1A1008] shadow-[0_4px_16px_rgba(26,16,8,0.08)] animate-[float-badge-1_3s_ease-in-out_infinite]">
        ✦ 98% Open Rate
      </div>

      <div className="absolute bottom-[-14px] right-[-20px] z-20 bg-[rgba(196,30,58,0.08)] border border-[rgba(196,30,58,0.3)] rounded-[3px] p-[6px_12px] text-[11px] text-[#C41E3A] shadow-[0_4px_16px_rgba(26,16,8,0.08)] animate-[float-badge-2_4s_ease-in-out_infinite] [animation-delay:1s]">
        ▲ ↑ 3.2x more responses
      </div>

      <div className="absolute top-[40%] right-[-32px] -translate-y-1/2 z-20 bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] p-[6px_12px] text-[11px] text-[#1A1008] shadow-[0_4px_16px_rgba(26,16,8,0.08)] animate-[float-badge-3_3.5s_ease-in-out_infinite] [animation-delay:0.5s]">
        🔒 256-bit encrypted
      </div>

      {/* Glass Card Base */}
      <div 
        className="w-full bg-[rgba(250,247,242,0.55)] border border-[rgba(212,201,176,0.6)] rounded-[8px] p-7 shadow-[0_8px_48px_rgba(26,16,8,0.10),0_1px_0px_rgba(255,255,255,0.8)_inset]"
        style={{
          backdropFilter: "blur(18px) saturate(1.4)",
          WebkitBackdropFilter: "blur(18px) saturate(1.4)"
        }}
      >
        {/* Form Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#C41E3A]" />
          <span className="font-serif text-sm text-[#1A1008] font-medium">Customer Feedback Form</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-[3px] bg-[#EDE8DC] rounded-[2px] mb-6 overflow-hidden">
          <div className="progress-bar-fill h-full bg-[#C41E3A] rounded-[2px]" />
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-left">
          {/* Field 1 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-[#6B5744] font-medium uppercase tracking-wide">Your Name</label>
            <div className="w-full bg-[rgba(255,255,255,0.7)] border border-[#D4C9B0] rounded-[3px] p-[10px_14px] text-sm text-[#1A1008] min-h-[42px] flex items-center">
              {nameText}
              <span className="inline-block w-[1px] h-4 bg-[#C41E3A] ml-0.5 animate-[cursor-blink_0.8s_steps(1)_infinite]" />
            </div>
          </div>

          {/* Field 2 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-[#6B5744] font-medium uppercase tracking-wide">Overall Experience</label>
            <div className="flex gap-1.5 py-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span 
                  key={i}
                  className="star-icon text-xl"
                  style={{
                    color: i < 4 ? "#C41E3A" : "#D4C9B0",
                    animationDelay: `${1.8 + i * 0.15}s`
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Field 3 */}
          <div className="space-y-1.5 relative">
            <label className="block text-[11px] text-[#6B5744] font-medium uppercase tracking-wide">How did you hear about us?</label>
            <div className="w-full bg-[rgba(255,255,255,0.7)] border border-[#D4C9B0] rounded-[3px] p-[10px_14px] text-sm text-[#1A1008] cursor-default flex justify-between items-center">
              <span>Social Media</span>
              <span className="text-xs text-[#6B5744]">▼</span>
            </div>

            {/* Dropdown Options */}
            <div 
              className={`absolute top-[100%] left-0 w-full bg-[#FAF7F2] border border-[#D4C9B0] rounded-[3px] mt-1 z-10 overflow-hidden transition-all duration-300 ${
                dropdownOpen ? "opacity-100 max-h-[200px] shadow-md" : "opacity-0 max-h-0 pointer-events-none"
              }`}
            >
              <div className="p-2.5 text-xs text-[#1A1008] hover:bg-[#EDE8DC] flex justify-between items-center cursor-pointer">
                <span>Social Media</span>
                <span className="text-[#C41E3A]">✓</span>
              </div>
              <div className="p-2.5 text-xs text-[#1A1008] hover:bg-[#EDE8DC] cursor-pointer">
                Search Engine
              </div>
              <div className="p-2.5 text-xs text-[#1A1008] hover:bg-[#EDE8DC] cursor-pointer">
                Friend Referral
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button className="w-full bg-[#C41E3A] hover:bg-[#8B1A2A] text-white text-xs font-medium py-3 rounded-[3px] transition-colors shadow-none mt-2 animate-[pulse-ring_2s_infinite]">
            Submit Response →
          </button>
        </div>
      </div>
    </div>
  );
}

interface HomeClientProps {
  serverStatus: string;
}

export default function HomeClient({ serverStatus }: HomeClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Add loaded class after short delay
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);

    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className={`japanese-minimalist min-h-screen bg-[#F5F0E8] text-[#1A1008] selection:bg-[#C41E3A]/10 overflow-hidden relative ${loaded ? "loaded" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Noto+Serif+JP:wght@400;700&display=swap');
        
        .japanese-minimalist h1, 
        .japanese-minimalist h2, 
        .japanese-minimalist h3 {
          font-family: 'Noto Serif JP', serif !important;
        }
        
        .japanese-minimalist p, 
        .japanese-minimalist span, 
        .japanese-minimalist button, 
        .japanese-minimalist nav,
        .japanese-minimalist a {
          font-family: 'Inter', sans-serif !important;
        }
        
        .hero-pattern::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle, #D4C9B0 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.18;
          z-index: 0;
          pointer-events: none;
        }

        .shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
          background-size: 200% 100%;
          background-position: -100% 0;
          transition: none;
          pointer-events: none;
        }
        .shimmer-btn:hover::after {
          animation: shimmer-sweep 0.5s ease-out;
        }

        @keyframes shimmer-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes cursor-blink {
          50% { opacity: 0; }
        }

        @keyframes float-badge-1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-badge-2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-badge-3 {
          0%, 100% { transform: translateY(-50%) translateY(-4px); }
          50% { transform: translateY(-50%) translateY(4px); }
        }

        @keyframes float-vertical-text {
          0%, 100% { transform: translateY(-50%) translateY(-6px); }
          50% { transform: translateY(-50%) translateY(6px); }
        }

        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(196,30,58,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(196,30,58,0); }
          100% { box-shadow: 0 0 0 0 rgba(196,30,58,0); }
        }

        @keyframes star-bounce {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        .star-icon {
          opacity: 0;
        }
        .loaded .star-icon {
          animation: star-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .progress-bar-fill {
          width: 0%;
          transition: width 1s ease-out 1.2s;
        }
        .loaded .progress-bar-fill {
          width: 66%;
        }

        /* Entry Animations */
        .hero-transition-pill {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        .loaded .hero-transition-pill {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-transition-jp {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.7s ease-out 0.15s, transform 0.7s ease-out 0.15s;
        }
        .loaded .hero-transition-jp {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-transition-en {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.7s ease-out 0.3s, transform 0.7s ease-out 0.3s;
        }
        .loaded .hero-transition-en {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-transition-line {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.6s ease-out 0.5s;
        }
        .loaded .hero-transition-line {
          transform: scaleX(1);
        }

        .hero-transition-sub {
          opacity: 0;
          transition: opacity 0.6s ease-out 0.6s;
        }
        .loaded .hero-transition-sub {
          opacity: 1;
        }

        .hero-transition-stats {
          opacity: 0;
          transition: opacity 0.5s ease-out 0.8s;
        }
        .loaded .hero-transition-stats {
          opacity: 1;
        }

        .hero-transition-buttons {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s ease-out 1s, transform 0.5s ease-out 1s;
        }
        .loaded .hero-transition-buttons {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-card {
          transition: border-color 0.2s ease;
        }
        .feature-card:hover {
          border-color: #C41E3A;
        }

        .fuji-svg {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: auto;
          min-height: 340px;
          max-height: 65%;
          z-index: 1;
          pointer-events: none;
          opacity: 0;
          transform: translateY(20px);
          animation: fuji-fade-in 1.8s ease-out 0.3s forwards;
        }
        @keyframes fuji-fade-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 1023px) {
          .fuji-svg {
            max-height: 45%;
          }
        }
        @media (max-width: 767px) {
          .fuji-svg {
            max-height: 35%;
          }
          .fuji-far-mountains { opacity: 0.85 !important; }
          .fuji-main-body { opacity: 0.9 !important; }
          .fuji-snow-cap { opacity: 0.98 !important; }
          .fuji-snow-streaks { opacity: 0.9 !important; }
          .fuji-mist-band { animation-name: fuji-mist-breath-mobile !important; }
          .fuji-treeline { opacity: 0.75 !important; }
          .fuji-torii { opacity: 0.5 !important; }
        }
        .fuji-far-mountains { fill: #E8E0D0; opacity: 0.75; }
        .fuji-main-body { fill: #DDD5C4; opacity: 0.8; }
        .fuji-snow-cap { fill: #FAF7F2; opacity: 0.95; }
        .fuji-snow-streaks { fill: #FAF7F2; opacity: 0.8; }
        .fuji-torii { fill: #C41E3A; opacity: 0.38; }

        .fuji-mist-band {
          fill: #F5F0E8;
          opacity: 0.6;
          animation: fuji-mist-breath 6s ease-in-out infinite;
        }
        @keyframes fuji-mist-breath {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes fuji-mist-breath-mobile {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        .fuji-treeline {
          fill: #C8BEA8;
          opacity: 0.65;
          animation: fuji-treeline-sway 8s ease-in-out infinite;
        }
        @keyframes fuji-treeline-sway {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-4px); }
        }
      ` }} />

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[#D4C9B0] ${
          scrolled ? "bg-[rgba(245,240,232,0.9)] backdrop-blur-[12px] py-3" : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#C41E3A] text-lg transition-colors duration-300 hover:text-[#8B1A2A] cursor-default">⛩</span>
            <span className="text-lg font-bold tracking-tight text-[#C41E3A] font-serif">
              FinalForms
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link href="/explore" className="text-xs font-medium text-[#1A1008] hover:text-[#C41E3A] transition-colors">
              Explore
            </Link>
            <Link href="/pricing" className="text-xs font-medium text-[#1A1008] hover:text-[#C41E3A] transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="border border-[#C41E3A] text-[#C41E3A] hover:bg-[#C41E3A]/5 bg-transparent text-xs rounded-[4px] px-4 py-2 h-auto shadow-none font-medium">
                Log In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white text-xs rounded-[4px] px-4 py-2 h-auto shadow-none font-medium border-none">
                Sign Up
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Decorative horizontal rule below the navbar (offset for sticky header) */}
      <div className="h-16" />

      {/* Hero Section */}
      <section className="hero-pattern min-h-[92vh] flex items-center relative z-10 px-6 md:px-0">
        {/* Large blurred crimson circle behind the right column */}
        <div className="absolute right-[10%] top-[20%] w-[480px] h-[480px] bg-[radial-gradient(circle,rgba(196,30,58,0.07)_0%,transparent_70%)] rounded-full z-0 pointer-events-none" />

        {/* Vertical Japanese text element on the far right */}
        <div 
          className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 text-[#D4C9B0] text-[13px] font-normal tracking-[0.2em] animate-[float-vertical-text_5s_ease-in-out_infinite]" 
          style={{ writingMode: "vertical-rl" }}
        >
          フォームビルダー
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-[55%_45%] items-center z-20 gap-12 pt-10 pb-16 pl-[clamp(60px,8vw,120px)] pr-[clamp(40px,6vw,80px)]">
          {/* Left Column */}
          <div className="text-left space-y-6 flex flex-col items-start justify-center md:max-w-[560px] relative z-20">
            {/* Pill Badge */}
            <div className="hero-transition-pill border border-[#C41E3A] bg-[rgba(196,30,58,0.06)] text-[#C41E3A] text-[11px] font-medium uppercase tracking-[0.12em] px-3.5 py-1 rounded-[2px]">
              ✦ Typeform-style SaaS
            </div>

            {/* Headings */}
            <div className="space-y-1">
              <h1 title="Build Beautiful Forms" className="hero-transition-jp text-[52px] font-normal text-[#1A1008] leading-tight tracking-[0.08em]">
                美しいフォームを
              </h1>
              <h1 
                className="hero-transition-en text-[68px] font-bold text-[#C41E3A] leading-[1.05]"
                style={{ textShadow: "2px 2px 0px rgba(196,30,58,0.12)" }}
              >
                Build Beautiful Forms
              </h1>
            </div>

            {/* Accent Line */}
            <div className="hero-transition-line w-12 h-[2px] bg-[#C41E3A] my-5" />

            {/* Subheading */}
            <p className="hero-transition-sub text-[#6B5744] text-[17px] leading-[1.8] max-w-[440px] font-normal">
              A typeform-style form builder crafted with precision. Create, publish, and analyse — with the calm focus of Japanese design.
            </p>

            {/* Stats Row */}
            <div className="hero-transition-stats flex items-center gap-6 py-2">
              <div>
                <div className="font-serif text-[22px] font-bold text-[#1A1008]">2,400+</div>
                <div className="text-[11px] text-[#6B5744]">Forms Created</div>
              </div>
              <div className="h-9 w-px bg-[#D4C9B0]" />
              <div>
                <div className="font-serif text-[22px] font-bold text-[#1A1008]">98%</div>
                <div className="text-[11px] text-[#6B5744]">Uptime</div>
              </div>
              <div className="h-9 w-px bg-[#D4C9B0]" />
              <div>
                <div className="font-serif text-[22px] font-bold text-[#1A1008]">4.9★</div>
                <div className="text-[11px] text-[#6B5744]">Rating</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="hero-transition-buttons flex flex-wrap items-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button className="shimmer-btn bg-[#C41E3A] hover:bg-[#8B1A2A] text-[#FAF7F2] px-9 py-3.5 h-auto rounded-[3px] font-medium transition-all duration-200 border-none shadow-none text-sm hover:-translate-y-[1px]">
                  Start Building Now
                </Button>
              </Link>

              <Link href="/explore">
                <Button variant="link" className="text-[#C41E3A] bg-transparent px-5 py-3.5 h-auto font-medium shadow-none text-sm border-none hover:translate-x-[3px] transition-all hover:no-underline hover:underline">
                  View Demo →
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="hidden md:flex justify-center items-center relative z-20">
            <FormGlassDemo />
          </div>
        </div>

        {/* Subtle Mount Fuji Background Illustration */}
        <svg 
          className="fuji-svg" 
          viewBox="0 0 1400 500" 
          preserveAspectRatio="xMidYMax slice" 
          width="100%" 
          height="100%" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sky-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5F0E8" stopOpacity="0" />
              <stop offset="70%" stopColor="#F5F0E8" stopOpacity="0" />
              <stop offset="100%" stopColor="#EDE8DC" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="top-fade-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5F0E8" stopOpacity="1" />
              <stop offset="40%" stopColor="#F5F0E8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Layer 1 — Sky Gradient */}
          <rect width="1400" height="500" fill="url(#sky-gradient)" />

          {/* Layer 2 — Far background mountains */}
          <path 
            d="M 0 500 L 0 450 Q 150 400 300 380 Q 450 420 700 500 Z M 600 500 Q 850 400 1050 360 Q 1250 410 1400 440 L 1400 500 Z" 
            className="fuji-far-mountains" 
          />

          {/* Layer 3 — Mount Fuji main body */}
          <path 
            d="M 220 500 C 500 480 700 350 740 175 L 800 175 C 840 350 1040 480 1320 500 Z" 
            className="fuji-main-body" 
          />

          {/* Layer 4 — Snow cap */}
          <path 
            d="M 714 233 C 723 195 732 180 740 175 L 800 175 C 808 180 817 195 826 233 C 810 245 800 230 790 250 C 780 260 770 235 760 255 C 750 240 740 250 730 235 C 720 245 718 235 714 233 Z" 
            className="fuji-snow-cap" 
          />
          {/* Layer 4 — Snow streaks */}
          <path 
            d="M 731 238 Q 734 260 732 280 Q 728 260 731 238 Z M 751 243 Q 754 270 752 295 Q 748 270 751 243 Z M 771 243 Q 774 275 773 305 Q 768 275 771 243 Z M 787 240 Q 790 265 789 290 Q 785 265 787 240 Z M 807 236 Q 811 255 810 275 Q 805 255 807 236 Z" 
            className="fuji-snow-streaks" 
          />

          {/* Layer 5 — Subtle mist / cloud band */}
          <rect x="0" y="290" width="1400" height="20" rx="10" ry="10" className="fuji-mist-band" />

          {/* Crimson accent (Torii Gate) */}
          <g className="fuji-torii">
            <path d="M 1093 277 Q 1121 280 1149 277 L 1150 281 Q 1121 284 1092 281 Z" />
            <rect x="1100" y="287" width="43" height="2.5" />
            <rect x="1106" y="281" width="3" height="54" />
            <rect x="1134" y="281" width="3" height="54" />
          </g>

          {/* Layer 6 — Foreground treeline */}
          <path 
            d="M 0 500 L 0 470 L 15 485 L 25 465 L 40 480 L 55 460 L 70 475 L 85 455 L 100 480 L 115 468 L 125 478 L 140 458 L 155 475 L 170 462 L 185 480 L 200 470 L 210 460 L 225 475 L 240 455 L 255 472 L 270 465 L 285 480 L 300 470 L 315 458 L 330 475 L 345 463 L 360 480 L 375 468 L 385 478 L 400 458 L 415 475 L 430 460 L 445 478 L 460 465 L 470 455 L 485 472 L 500 460 L 515 475 L 530 458 L 545 470 L 560 480 L 575 468 L 585 478 L 600 458 L 615 475 L 630 462 L 645 480 L 660 470 L 670 460 L 685 475 L 700 455 L 715 472 L 730 465 L 745 480 L 760 470 L 775 458 L 790 475 L 805 463 L 820 480 L 835 468 L 845 478 L 860 458 L 875 475 L 890 460 L 905 478 L 920 465 L 930 455 L 945 472 L 960 460 L 975 475 L 990 458 L 1005 470 L 1020 480 L 1035 468 L 1045 478 L 1060 458 L 1075 475 L 1090 462 L 1105 480 L 1120 470 L 1130 460 L 1145 475 L 1160 455 L 1175 472 L 1190 465 L 1205 480 L 1220 470 L 1235 458 L 1250 475 L 1265 463 L 1280 480 L 1295 468 L 1305 478 L 1320 458 L 1335 475 L 1350 460 L 1365 478 L 1380 465 L 1390 455 L 1400 470 L 1400 500 Z" 
            className="fuji-treeline" 
          />

          {/* Top Overlay Fade */}
          <rect width="1400" height="500" fill="url(#top-fade-gradient)" />
        </svg>
      </section>

      {/* How It Works Section */}
      <section className="bg-[#EDE8DC] border-t border-b border-[#D4C9B0] py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center mb-12">
            <div className="border-l-3 border-[#C41E3A] pl-3 py-0.5 text-left">
              <span className="text-[#C41E3A] text-[11px] font-bold uppercase tracking-[0.2em] block">
                Simple & Powerful
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#1A1008] text-center mb-12">
            How FinalForms Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "一", title: "Build Your Form", desc: "Drag-and-drop 8 field types. Set validations, themes, and conditional logic in seconds." },
              { step: "二", title: "Share Instantly", desc: "Publish with a click. Share via custom slug URL, QR code, or embed on your site." },
              { step: "三", title: "Analyze Results", desc: "Real-time drop-off funnel charts, completion rates, and one-click CSV export." },
            ].map((s) => (
              <div 
                key={s.step} 
                className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-[2px] p-[28px_24px] flex flex-col space-y-4 relative overflow-hidden group border-b-[2px] border-b-[#C41E3A]"
              >
                <div className="text-[48px] font-bold text-[#C41E3A] leading-none">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-[#1A1008]">{s.title}</h3>
                <p className="text-sm text-[#6B5744] leading-[1.65]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-[#F5F0E8] py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="feature-card bg-[#FAF7F2] border border-[#D4C9B0] rounded-[2px] p-8 space-y-4">
              <div className="text-[#C41E3A]">
                <Palette className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A1008]">Premium Layout Themes</h3>
              <p className="text-[13px] text-[#6B5744] leading-[1.7]">
                Design for Hogwarts sorcerers, Night City cyberpunks, or modern tech founders. High-fidelity layouts adjust to your styling with one click.
              </p>
            </div>

            <div className="feature-card bg-[#FAF7F2] border border-[#D4C9B0] rounded-[2px] p-8 space-y-4">
              <div className="text-[#C41E3A]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A1008]">Relational Analytics</h3>
              <p className="text-[13px] text-[#6B5744] leading-[1.7]">
                Visualize question funnel drop-offs, track partial drafts, and get clean MCQ distributions computed directly in database aggregations.
              </p>
            </div>

            <div className="feature-card bg-[#FAF7F2] border border-[#D4C9B0] rounded-[2px] p-8 space-y-4">
              <div className="text-[#C41E3A]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-[17px] font-bold text-[#1A1008]">Anti-Bot & Rate Limits</h3>
              <p className="text-[13px] text-[#6B5744] leading-[1.7]">
                Equipped with honeypot fields and sliding-window IP limits to shield creators from spam form submissions and database pollution.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1008] py-8 text-xs text-[#D4C9B0] relative z-10 border-t border-[#D4C9B0]/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
          <div className="text-[#C41E3A] text-[13px] italic font-serif tracking-wider">
            形を通じて、心をつなぐ
          </div>
          
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[#A89880]">© 2026 FinalForms Inc. All rights reserved.</span>
            
            <div className="flex items-center gap-2 text-[#A89880]">
              <div className={`h-2 w-2 rounded-full ${serverStatus === "healthy" ? "bg-[#4A7C59] animate-pulse" : "bg-[#C41E3A]"}`} />
              <span>tRPC Server Status: <span className="font-mono capitalize">{serverStatus}</span></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
