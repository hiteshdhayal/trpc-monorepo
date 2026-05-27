"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Check,
  AlertCircle,
  Lock,
} from "lucide-react";

// Framer Motion slide variants for question transitions
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.18, ease: "easeIn" as const },
  }),
};

export default function PublicFormFillerPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [responseId, setResponseId] = useState<string | null>(null);
  const [respondentEmail, setRespondentEmail] = useState("");

  // Password gate state
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Bot protection honeypot state
  const [honeypot, setHoneypot] = useState("");

  // Fetch form fields
  const {
    data: form,
    isLoading,
    error,
  } = trpc.form.getFormById.useQuery({ id: formId }, { retry: false, refetchOnWindowFocus: false });

  // Sync partial progress mutation
  const partialSyncMutation = trpc.form.startOrUpdateResponse.useMutation({
    onSuccess: (data) => {
      setResponseId(data.responseId);
      localStorage.setItem(`form_res_id_${formId}`, data.responseId);
    },
    onError: (err) => {
      console.error("Failed to sync partial answer:", err);
    },
  });

  // Final submission mutation
  const submitFormMutation = trpc.form.submitResponse.useMutation({
    onSuccess: () => {
      localStorage.removeItem(`form_res_id_${formId}`);
      localStorage.removeItem(`form_answers_${formId}`);
      localStorage.removeItem(`form_step_${formId}`);
      localStorage.removeItem(`form_email_${formId}`);
      router.push(`/forms/${formId}/success`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit form responses. Please check validation rules.");
    },
  });

  // Password verification mutation
  const verifyPasswordMutation = trpc.form.verifyFormPassword.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setPasswordUnlocked(true);
        setPasswordError("");
        sessionStorage.setItem(`form_pw_${formId}`, "unlocked");
      } else {
        setPasswordError("Incorrect password. Please try again.");
      }
    },
    onError: () => {
      setPasswordError("Failed to verify password. Please try again.");
    },
  });

  // Restore state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedResId = localStorage.getItem(`form_res_id_${formId}`);
      const savedAnswers = localStorage.getItem(`form_answers_${formId}`);
      const savedStep = localStorage.getItem(`form_step_${formId}`);
      const savedEmail = localStorage.getItem(`form_email_${formId}`);

      if (savedResId) setResponseId(savedResId);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
      if (savedStep) setCurrentStep(Number(savedStep));
      if (savedEmail) setRespondentEmail(savedEmail);
    } catch (e) {
      console.warn("Failed to load local storage state:", e);
    }
  }, [formId]);

  // Restore password unlock from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(`form_pw_${formId}`);
    if (saved === "unlocked") setPasswordUnlocked(true);
  }, [formId]);

  // Persist local state whenever it changes
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`form_answers_${formId}`, JSON.stringify(answers));
    }
    localStorage.setItem(`form_step_${formId}`, String(currentStep));
    if (respondentEmail) {
      localStorage.setItem(`form_email_${formId}`, respondentEmail);
    }
  }, [answers, currentStep, respondentEmail, formId]);

  const fields = form?.fields ?? [];
  const theme = form?.theme ?? "startup";

  // Conditional Logic: compute which fields are visible based on current answers
  const visibleFields = fields.filter((field) => {
    const logic = field.conditionalLogic as { showIfFieldId?: string; showIfValue?: string } | null;
    if (!logic?.showIfFieldId) return true; // no condition → always show
    const dependentAnswer = answers[logic.showIfFieldId];
    if (Array.isArray(dependentAnswer)) {
      return dependentAnswer.includes(logic.showIfValue);
    }
    return String(dependentAnswer ?? "") === String(logic.showIfValue ?? "");
  });

  const totalSteps = visibleFields.length + 1; // +1 for the intro/email screen
  const isIntroScreen = currentStep === 0;
  const isQuestionScreen = currentStep > 0 && currentStep <= visibleFields.length;
  const currentField = isQuestionScreen ? visibleFields[currentStep - 1] : null;

  // Form theme definitions
  const getThemeStyles = () => {
    switch (theme) {
      case "hogwarts":
        return {
          wrapper: "bg-[#F5F0E8] text-[#1A1008]",
          card: "bg-[#FAF7F2] border-[#D4C9B0] shadow-none",
          accent: "text-[#C41E3A]",
          button: "bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-semibold",
          input:
            "bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] focus:border-[#C41E3A]",
          option: "bg-[#FAF7F2] border-[#D4C9B0] hover:border-[#C41E3A]/40 text-[#6B5744]",
          optionActive: "bg-[rgba(196,30,58,0.08)] border-[#C41E3A] text-[#1A1008]",
          progress: "bg-[#C41E3A]",
        };
      case "cyberpunk":
        return {
          wrapper: "bg-[#F5F0E8] text-[#1A1008] font-mono",
          card: "bg-[#FAF7F2] border-2 border-[#1A1008] shadow-none",
          accent: "text-[#C41E3A]",
          button: "bg-[#1A1008] hover:bg-[#C41E3A] text-white font-bold uppercase",
          input:
            "bg-[#FAF7F2] border-2 border-[#1A1008] text-[#1A1008] placeholder-[#A89880] focus:border-[#C41E3A]",
          option: "bg-[#FAF7F2] border border-[#D4C9B0] hover:border-[#1A1008] text-[#6B5744]",
          optionActive: "bg-[rgba(196,30,58,0.08)] border-2 border-[#C41E3A] text-[#1A1008]",
          progress: "bg-[#C41E3A]",
        };
      case "startup":
      default:
        return {
          wrapper: "bg-[#F5F0E8] text-[#1A1008]",
          card: "bg-[#FAF7F2] border-[#D4C9B0] shadow-none",
          accent: "text-[#C41E3A]",
          button: "bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium",
          input:
            "bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] focus:border-[#C41E3A]",
          option: "bg-[#FAF7F2] border-[#D4C9B0] hover:border-[#C41E3A]/40 text-[#6B5744]",
          optionActive: "bg-[rgba(196,30,58,0.08)] border-[#C41E3A] text-[#1A1008]",
          progress: "bg-[#C41E3A]",
        };
    }
  };

  const style = getThemeStyles();

  // Validate answer for the current question
  const validateCurrentStep = (): boolean => {
    if (isIntroScreen) {
      if (respondentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
      return true;
    }

    if (currentField) {
      const val = answers[currentField.id];
      if (
        currentField.required &&
        (val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0))
      ) {
        toast.error(`"${currentField.label}" is required.`);
        return false;
      }

      if (currentField.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
    }

    return true;
  };

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) return;
    setDirection(1);

    // Save partial answers to backend database
    if (currentField) {
      const val = answers[currentField.id];
      partialSyncMutation.mutate({
        formId,
        responseId: responseId || undefined,
        fieldId: currentField.id,
        answer: val,
        respondentEmail: respondentEmail.trim() ? respondentEmail.trim() : undefined,
        honeypot, // trap bots
      });
    }

    if (currentStep < visibleFields.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final Submit — only send answers for visible fields
      const payloadAnswers = visibleFields.map((f) => ({
        fieldId: f.id,
        answer: answers[f.id] !== undefined ? answers[f.id] : null,
      }));

      submitFormMutation.mutate({
        formId,
        responseId: responseId!,
        answers: payloadAnswers,
        respondentEmail: respondentEmail.trim() ? respondentEmail.trim() : undefined,
        honeypot, // trap bots
      });
    }
  }, [
    currentStep,
    currentField,
    answers,
    responseId,
    respondentEmail,
    honeypot,
    visibleFields,
    formId,
    partialSyncMutation,
    submitFormMutation,
  ]);

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectOption = (fieldId: string, val: string) => {
    setAnswers({ ...answers, [fieldId]: val });
  };

  const handleCheckboxOption = (fieldId: string, val: string) => {
    const current = (answers[fieldId] as Array<string>) || [];
    const updated = current.includes(val) ? current.filter((x) => x !== val) : [...current, val];
    setAnswers({ ...answers, [fieldId]: updated });
  };

  // Enter key advances to next step
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      }
    },
    [handleNext],
  );

  const progressPct = (currentStep / totalSteps) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-4 py-8">
        {/* Skeleton progress bar */}
        <div className="w-full max-w-xl h-1 bg-[#D4C9B0] rounded-full overflow-hidden mb-6">
          <div className="h-full w-1/3 bg-[#D4C9B0]/60 rounded-full animate-pulse" />
        </div>
        {/* Skeleton card */}
        <div className="w-full max-w-xl bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Skeleton badge */}
          <div className="h-5 w-28 bg-[#EDE8DC] rounded-full animate-pulse" />
          {/* Skeleton heading */}
          <div className="space-y-3">
            <div className="h-7 w-3/4 bg-[#EDE8DC] rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-[#EDE8DC] rounded animate-pulse" />
          </div>
          {/* Skeleton input */}
          <div className="h-11 w-full bg-[#EDE8DC] rounded-lg animate-pulse" />
          {/* Skeleton buttons row */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D4C9B0]/40">
            <div className="h-9 w-20 bg-[#EDE8DC] rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-[#EDE8DC] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !form) {
    // Fix 4: Parse tRPC error to show specific error screens
    const errorMessage = error?.message || "";
    const errorCode = (error?.data as { code?: string })?.code || "";

    // Case: Form expired
    if (errorMessage.toLowerCase().includes("expired")) {
      return (
        <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] flex flex-col items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-8 max-w-sm text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-[rgba(196,30,58,0.08)] flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-[#C41E3A]" />
            </div>
            <h2 className="text-xl font-serif font-bold">Form Expired</h2>
            <p className="text-[#6B5744] text-sm">
              This form is no longer accepting responses because its expiry date has passed.
            </p>
          </div>
        </div>
      );
    }

    // Case: Form unpublished / draft
    if (
      errorMessage.toLowerCase().includes("not accepting") ||
      errorMessage.toLowerCase().includes("draft")
    ) {
      return (
        <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] flex flex-col items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-8 max-w-sm text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-[rgba(196,30,58,0.08)] flex items-center justify-center">
              <Lock className="h-7 w-7 text-[#C41E3A]" />
            </div>
            <h2 className="text-xl font-serif font-bold">Form Unpublished</h2>
            <p className="text-[#6B5744] text-sm">
              This form is not currently published and is not accepting responses. Please contact
              the form creator.
            </p>
          </div>
        </div>
      );
    }

    // Case: Form closed (response limit reached)
    if (
      errorMessage.toLowerCase().includes("response limit") ||
      errorMessage.toLowerCase().includes("closed")
    ) {
      return (
        <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] flex flex-col items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-8 max-w-sm text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-[rgba(196,30,58,0.08)] flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-[#C41E3A]" />
            </div>
            <h2 className="text-xl font-serif font-bold">Form Closed</h2>
            <p className="text-[#6B5744] text-sm">
              This form has reached its maximum number of responses and is no longer accepting
              submissions.
            </p>
          </div>
        </div>
      );
    }

    // Default: Form not found / deleted
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] flex flex-col items-center justify-center p-4">
        <div className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-8 max-w-sm text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-[rgba(196,30,58,0.08)] flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-[#C41E3A]" />
          </div>
          <h2 className="text-xl font-serif font-bold">Form Not Found</h2>
          <p className="text-[#6B5744] text-sm">
            This form does not exist or has been deleted by its creator.
          </p>
        </div>
      </div>
    );
  }

  // Password gate: show lock screen if form is password-protected and not yet unlocked
  if (form.isPasswordProtected && !passwordUnlocked) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#FAF7F2] border border-[#D4C9B0] rounded-2xl p-8 shadow-none space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(196,30,58,0.08)] border border-[#C41E3A]/20 flex items-center justify-center">
              <Lock className="h-7 w-7 text-[#C41E3A]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1A1008]">{form.title}</h2>
              <p className="text-[#6B5744] text-sm mt-1">
                This form is password protected. Enter the password to continue.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="form-password" className="text-[#6B5744] text-sm">
              Password
            </Label>
            <Input
              id="form-password"
              type="password"
              placeholder="Enter form password..."
              className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] focus:border-[#C41E3A]"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && passwordInput.trim()) {
                  verifyPasswordMutation.mutate({ formId, password: passwordInput });
                }
              }}
              autoFocus
            />
            {passwordError && (
              <p className="text-[#C41E3A] text-xs flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {passwordError}
              </p>
            )}
          </div>

          <Button
            className="w-full bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium cursor-pointer"
            onClick={() => {
              if (passwordInput.trim()) {
                verifyPasswordMutation.mutate({ formId, password: passwordInput });
              }
            }}
            disabled={verifyPasswordMutation.isPending || !passwordInput.trim()}
          >
            {verifyPasswordMutation.isPending ? (
              <>
                <Lock className="h-4 w-4 mr-2 animate-pulse" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Unlock Form
              </>
            )}
          </Button>

          <p className="text-center text-[10px] text-[#A89880]">Powered by FinalForms</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden ${style.wrapper}`}
    >
      {/* Bot spam protection: hidden honeypot field */}
      <input
        type="text"
        name="website_url_field"
        className="absolute -top-[9999px] -left-[9999px] hidden"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      {/* Top progress bar */}
      <div className="w-full max-w-xl h-1 bg-[#D4C9B0] rounded-full overflow-hidden mb-6 shrink-0">
        <motion.div
          className={`h-full ${style.progress}`}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Conversational stepper card container */}
      <div className="w-full max-w-xl flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            <Card className={`w-full border p-6 sm:p-8 rounded-2xl ${style.card}`}>
              <CardContent className="p-0" onKeyDown={handleKeyDown}>
                {/* STEP 0: Email / Greeting Screen */}
                {isIntroScreen && (
                  <div className="space-y-6 text-center sm:text-left">
                    <div className="space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1008] tracking-tight">
                        {form.title}
                      </h1>
                      {form.description && (
                        <p className="text-sm text-[#6B5744] leading-relaxed">{form.description}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="respondentEmail"
                        className="text-[#6B5744] text-xs font-semibold block text-left"
                      >
                        Your email address (Optional)
                      </Label>
                      <Input
                        id="respondentEmail"
                        type="email"
                        placeholder="name@company.com"
                        className={`h-11 rounded-lg ${style.input}`}
                        value={respondentEmail}
                        onChange={(e) => setRespondentEmail(e.target.value)}
                      />
                      <p className="text-[10px] text-[#6B5744] text-left">
                        We only use this to send you a copy of your responses.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-center sm:justify-start">
                      <Button
                        id="start-form-btn"
                        onClick={() => {
                          setDirection(1);
                          setCurrentStep(1);
                        }}
                        className={`h-11 px-6 rounded-lg flex items-center gap-2 cursor-pointer ${style.button}`}
                      >
                        Start Form
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEPS 1..N: Questions Stepper */}
                {isQuestionScreen && currentField && (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className={`border-[#D4C9B0] text-[10px] uppercase font-mono px-2 py-0.5 ${style.accent}`}
                      >
                        Question {currentStep} of {visibleFields.length}
                      </Badge>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1008] tracking-tight leading-snug mt-2">
                        {currentField.label}
                        {currentField.required && <span className="text-[#C41E3A] ml-1.5">*</span>}
                      </h2>
                    </div>

                    {/* Render Answer Interface based on field type */}
                    <div className="py-2">
                      {currentField.type === "short_text" && (
                        <Input
                          id={`field-${currentField.id}`}
                          placeholder={currentField.placeholder || "Type your answer here..."}
                          className={`h-11 rounded-lg ${style.input}`}
                          value={answers[currentField.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [currentField.id]: e.target.value })
                          }
                        />
                      )}

                      {currentField.type === "long_text" && (
                        <textarea
                          id={`field-${currentField.id}`}
                          placeholder={
                            currentField.placeholder || "Type your detailed answer here..."
                          }
                          className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] rounded-lg p-3 text-sm focus:border-[#C41E3A] outline-none resize-none h-32 focus:ring-1"
                          value={answers[currentField.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [currentField.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            // Don't advance on Enter for textareas (allow newlines with Shift+Enter)
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.stopPropagation();
                            }
                          }}
                        />
                      )}

                      {currentField.type === "email" && (
                        <Input
                          id={`field-${currentField.id}`}
                          type="email"
                          placeholder={currentField.placeholder || "name@example.com"}
                          className={`h-11 rounded-lg ${style.input}`}
                          value={answers[currentField.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [currentField.id]: e.target.value })
                          }
                        />
                      )}

                      {currentField.type === "number" && (
                        <Input
                          id={`field-${currentField.id}`}
                          type="number"
                          placeholder={currentField.placeholder || "0"}
                          className={`h-11 rounded-lg ${style.input}`}
                          value={answers[currentField.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [currentField.id]: e.target.value })
                          }
                        />
                      )}

                      {currentField.type === "date" && (
                        <Input
                          id={`field-${currentField.id}`}
                          type="date"
                          className={`h-11 rounded-lg ${style.input}`}
                          value={answers[currentField.id] || ""}
                          onChange={(e) =>
                            setAnswers({ ...answers, [currentField.id]: e.target.value })
                          }
                        />
                      )}

                      {currentField.type === "rating" && (
                        <div className="flex items-center gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((s) => {
                            const isSel = (answers[currentField.id] || 0) >= s;
                            return (
                              <motion.button
                                key={s}
                                id={`rating-${currentField.id}-${s}`}
                                type="button"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setAnswers({ ...answers, [currentField.id]: s })}
                                className={`text-3xl transition-colors cursor-pointer ${isSel ? "text-[#C41E3A]" : "text-[#D4C9B0] hover:text-[#A89880]"}`}
                              >
                                ★
                              </motion.button>
                            );
                          })}
                        </div>
                      )}

                      {currentField.type === "select" && (
                        <div className="space-y-2">
                          {(
                            (currentField.options as Array<{ label: string; value: string }>) || []
                          ).map((o, oIdx) => {
                            const isActive = answers[currentField.id] === o.value;
                            return (
                              <motion.div
                                key={oIdx}
                                id={`option-${currentField.id}-${oIdx}`}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectOption(currentField.id, o.value)}
                                className={`p-3 border rounded-xl cursor-pointer text-sm font-medium transition-all flex items-center justify-between ${
                                  isActive ? style.optionActive : style.option
                                }`}
                              >
                                <span className="flex-1">
                                  <span className="text-[10px] text-[#6B5744] uppercase mr-3">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  {o.label}
                                </span>
                                {isActive && <Check className="h-4 w-4 shrink-0 text-[#C41E3A]" />}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {currentField.type === "checkbox" && (
                        <div className="space-y-2">
                          {(
                            (currentField.options as Array<{ label: string; value: string }>) || []
                          ).map((o, oIdx) => {
                            const activeArr = (answers[currentField.id] as Array<string>) || [];
                            const isActive = activeArr.includes(o.value);
                            return (
                              <motion.div
                                key={oIdx}
                                id={`checkbox-${currentField.id}-${oIdx}`}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCheckboxOption(currentField.id, o.value)}
                                className={`p-3 border rounded-xl cursor-pointer text-sm font-medium transition-all flex items-center gap-3 ${
                                  isActive ? style.optionActive : style.option
                                }`}
                              >
                                <div
                                  className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                    isActive
                                      ? "bg-[#C41E3A] border-[#C41E3A]"
                                      : "border-[#D4C9B0] bg-[#FAF7F2]"
                                  }`}
                                >
                                  {isActive && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span>{o.label}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-[#D4C9B0]/40">
                      <Button
                        id="prev-step-btn"
                        variant="ghost"
                        onClick={handlePrev}
                        className="text-[#6B5744] hover:text-[#1A1008] flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>

                      <Button
                        id="next-step-btn"
                        onClick={handleNext}
                        className={`h-10 px-5 rounded-lg flex items-center gap-2 cursor-pointer ${style.button}`}
                        disabled={submitFormMutation.isPending}
                      >
                        {submitFormMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : currentStep === visibleFields.length ? (
                          <>
                            Submit Form
                            <Check className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Continue
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom lock footer badge */}
      <footer className="w-full text-center py-4 flex items-center justify-center gap-1.5 text-[10px] text-[#6B5744] shrink-0 font-serif">
        <ShieldCheck className="h-4 w-4 text-[#C41E3A]" />
        Safe Submission. Protected against automation spam.
      </footer>
    </div>
  );
}
