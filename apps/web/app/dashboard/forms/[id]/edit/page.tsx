"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Settings as SettingsIcon,
  BarChart2,
  Eye,
  FileSpreadsheet,
  Settings2,
  Layout,
  PlusCircle,
  Loader2,
  AlertTriangle,
  Copy,
  QrCode,
  Lock,
  KeyRound,
  Users2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Mail,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

type FormField = {
  id?: string;
  type: string;
  label: string;
  placeholder?: string | null;
  required: boolean;
  orderIndex: number;
  options?: any;
  validationRules?: any;
  conditionalLogic?: any;
};

const CHART_COLORS = ["#C41E3A", "#1A1008", "#6B5744", "#D4C9B0", "#A89880", "#E8D8C0"];

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const utils = trpc.useUtils();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab] = useState("build");
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number | null>(null);

  // Settings states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("startup");
  const [status, setStatus] = useState("published");
  const [visibility, setVisibility] = useState("unlisted");
  const [customSlug, setCustomSlug] = useState("");
  const [enableLimit, setEnableLimit] = useState(false);
  const [responseLimit, setResponseLimit] = useState<number>(100);
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>("");

  // Password protection states
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Responses tab pagination states
  const [responsesPage, setResponsesPage] = useState(1);
  const [completedOnly, setCompletedOnly] = useState(true);
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);

  // 1. Fetch form data
  const {
    data: form,
    isLoading: formLoading,
    error: formError,
  } = trpc.form.getFormById.useQuery({ id: formId }, { retry: false });

  // 2. Fetch Analytics
  const { data: analytics, isLoading: analyticsLoading } = trpc.form.getFormAnalytics.useQuery(
    { formId },
    { enabled: activeTab === "analytics", refetchOnWindowFocus: false },
  );

  // 3. Fetch paginated responses
  const { data: responsesData, isLoading: responsesLoading } =
    trpc.form.getResponsesPaginated.useQuery(
      { formId, page: responsesPage, limit: 20, completedOnly },
      { enabled: activeTab === "responses", refetchOnWindowFocus: false },
    );

  // Populate local states once form is loaded
  useEffect(() => {
    if (form) {
      setTitle(form.title);
      setDescription(form.description || "");
      setTheme(form.theme);
      setStatus(form.status);
      setVisibility(form.visibility);
      setCustomSlug(form.customSlug || "");
      setFields(
        form.fields.map((f) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder,
          required: f.required,
          orderIndex: f.orderIndex,
          options: f.options,
          validationRules: f.validationRules,
          conditionalLogic: f.conditionalLogic,
        })),
      );
      if (form.responseLimit) {
        setEnableLimit(true);
        setResponseLimit(form.responseLimit);
      } else {
        setEnableLimit(false);
      }
      if (form.expiryDate) {
        setEnableExpiry(true);
        setExpiryDate(new Date(form.expiryDate).toISOString().substring(0, 10));
      } else {
        setEnableExpiry(false);
      }
      // Populate password protection state
      setIsPasswordProtected((form as any).isPasswordProtected ?? false);
      if (form.fields.length > 0 && selectedFieldIdx === null) {
        setSelectedFieldIdx(0);
      }
    }
  }, [form]);

  // Auth/Load checking
  useEffect(() => {
    if (formError) {
      toast.error("Form not found or you are not authorized to view it.");
      router.push("/dashboard");
    }
  }, [formError, router]);

  // 3. Mutations
  const updateFormMutation = trpc.form.updateForm.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save settings.");
    },
  });

  const saveFieldsMutation = trpc.form.updateFormFields.useMutation({
    onSuccess: () => {
      toast.success("Form fields updated!");
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save fields.");
    },
  });

  const setPasswordMutation = trpc.form.setFormPassword.useMutation({
    onSuccess: () => {
      toast.success("Password protection enabled!");
      setPasswordInput("");
      setPasswordConfirm("");
      setIsPasswordProtected(true);
      setPasswordSaving(false);
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to set password.");
      setPasswordSaving(false);
    },
  });

  const removePasswordMutation = trpc.form.removeFormPassword.useMutation({
    onSuccess: () => {
      toast.success("Password protection removed.");
      setIsPasswordProtected(false);
      setPasswordSaving(false);
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove password.");
      setPasswordSaving(false);
    },
  });

  const handleSavePassword = () => {
    if (!passwordInput || passwordInput.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    if (passwordInput !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordMutation.mutate({ id: formId, password: passwordInput });
  };

  const handleRemovePassword = () => {
    if (!confirm("Remove password protection? Anyone with the link can fill this form.")) return;
    setPasswordSaving(true);
    removePasswordMutation.mutate({ id: formId });
  };

  // Settings Save handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormMutation.mutate({
      id: formId,
      title,
      description: description ?? undefined,
      theme,
      status: status as any,
      visibility: visibility as any,
      customSlug: customSlug.trim() ? customSlug.trim() : null,
      responseLimit: enableLimit ? Number(responseLimit) : null,
      expiryDate: enableExpiry && expiryDate ? new Date(expiryDate) : null,
    });
  };

  // Fields manipulation handlers
  const handleAddField = (type: string) => {
    const defaultLabels: Record<string, string> = {
      short_text: "What is your name?",
      long_text: "Tell us a bit about yourself:",
      select: "Choose one of the following:",
      checkbox: "Check all that apply:",
      rating: "How would you rate this service?",
      email: "Enter your email address:",
      number: "How old are you?",
      date: "Select your preferred date:",
    };

    const newField: FormField = {
      type,
      label: defaultLabels[type] || "New Question",
      placeholder: type === "select" || type === "checkbox" ? null : "Type your answer here...",
      required: true,
      orderIndex: fields.length,
      options:
        type === "select" || type === "checkbox"
          ? [
              { label: "Option 1", value: "opt_1" },
              { label: "Option 2", value: "opt_2" },
            ]
          : null,
      validationRules: type === "rating" ? { min: 1, max: 5 } : null,
    };

    const updated = [...fields, newField];
    setFields(updated);
    setSelectedFieldIdx(updated.length - 1);
  };

  const handleUpdateField = (index: number, updatedField: FormField) => {
    const updated = [...fields];
    updated[index] = updatedField;
    setFields(updated);
  };

  const handleDeleteField = (index: number) => {
    const updated = fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, orderIndex: i }));
    setFields(updated);
    if (selectedFieldIdx === index) {
      setSelectedFieldIdx(updated.length > 0 ? 0 : null);
    } else if (selectedFieldIdx !== null && selectedFieldIdx > index) {
      setSelectedFieldIdx(selectedFieldIdx - 1);
    }
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...fields];

    // Swap fields
    const temp = updated[index]!;
    updated[index] = updated[targetIdx]!;
    updated[targetIdx] = temp;

    // Correct orderIndices
    updated[index]!.orderIndex = index;
    updated[targetIdx]!.orderIndex = targetIdx;

    setFields(updated);
    setSelectedFieldIdx(targetIdx);
  };

  const handleSaveFields = () => {
    saveFieldsMutation.mutate({
      formId,
      fields: fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        required: f.required,
        orderIndex: f.orderIndex,
        options: f.options,
        validationRules: f.validationRules,
        conditionalLogic: f.conditionalLogic,
      })),
    });
  };

  // CSV download function - Fix: use cookie auth only, no token in URL (security)
  const handleDownloadCsv = () => {
    // The CSV Express endpoint reads the session_token cookie automatically
    const a = document.createElement("a");
    a.href = `/api/forms/${formId}/csv`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Preparing CSV stream download...");
  };

  // Copy share URL to clipboard
  const handleCopyLink = () => {
    const slug = form?.customSlug || formId;
    const url = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Share link copied to clipboard!");
    });
  };

  const formShareUrl = mounted
    ? `${window.location.origin}/forms/${form?.customSlug || formId}`
    : `https://finalforms.com/forms/${form?.customSlug || formId}`;

  if (formLoading || !form) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const selectedField = selectedFieldIdx !== null ? fields[selectedFieldIdx] : null;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] selection:bg-[rgba(196,30,58,0.15)] selection:text-[#1A1008] flex flex-col">
      {/* Top Builder Header */}
      <header className="border-b border-[#D4C9B0] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-[#6B5744] hover:text-[#1A1008]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-6 w-px bg-[#D4C9B0]" />
            <div>
              <h1 className="text-sm font-serif font-bold text-[#1A1008] truncate max-w-xs sm:max-w-sm md:max-w-md">
                {title}
              </h1>
              <p className="text-[10px] text-[#C41E3A] font-semibold uppercase tracking-wider">
                {theme} theme
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-[#EDE8DC] border border-[#D4C9B0] p-0.5 rounded-lg">
              <TabsTrigger
                value="build"
                className="text-xs px-3 py-1 cursor-pointer flex items-center gap-1.5 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white text-[#6B5744] data-[state=active]:shadow-none"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Build
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="text-xs px-3 py-1 cursor-pointer flex items-center gap-1.5 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white text-[#6B5744] data-[state=active]:shadow-none"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="responses"
                className="text-xs px-3 py-1 cursor-pointer flex items-center gap-1.5 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white text-[#6B5744] data-[state=active]:shadow-none"
              >
                <Users2 className="h-3.5 w-3.5" />
                Responses
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="text-xs px-3 py-1 cursor-pointer flex items-center gap-1.5 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white text-[#6B5744] data-[state=active]:shadow-none"
              >
                <BarChart2 className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Link href={`/forms/${formId}`} target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#6B5744] hover:text-[#1A1008] flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" />
                View Form
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <Tabs value={activeTab} className="flex-1 flex flex-col md:flex-row">
          {/* TAB 1: BUILD WORKSPACE */}
          <TabsContent
            value="build"
            className="flex-1 flex flex-col md:flex-row m-0 p-0 overflow-y-auto bg-[#F5F0E8]"
          >
            {/* Warning banner: published form with responses */}
            {form?.status !== "draft" && (analytics?.summary?.totalResponses ?? 0) > 0 && (
              <div className="w-full bg-[rgba(196,30,58,0.06)] border-b border-[#C41E3A]/30 px-4 py-3 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-[#C41E3A] shrink-0" />
                <p className="text-xs text-[#8B1A2A]">
                  <strong>
                    This form is {form?.status} and has {analytics?.summary?.totalResponses}{" "}
                    response(s).
                  </strong>{" "}
                  Adding or removing fields is locked to prevent data corruption. Clone the form to
                  make structural changes.
                </p>
              </div>
            )}
            {/* Left Config Panel */}
            <div className="w-full md:w-[450px] border-r border-[#D4C9B0] bg-[#FAF7F2] p-6 flex flex-col gap-6 select-none">
              {/* Toolbar: Field adder */}
              <div>
                <h3 className="text-xs font-serif font-bold uppercase text-[#6B5744] tracking-wider mb-3">
                  Add Fields
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: "short_text", label: "Short Text" },
                    { type: "long_text", label: "Long Text" },
                    { type: "select", label: "Multiple Choice" },
                    { type: "checkbox", label: "Checkboxes" },
                    { type: "rating", label: "Star Rating" },
                    { type: "email", label: "Email Address" },
                    { type: "number", label: "Number Input" },
                    { type: "date", label: "Date Picker" },
                  ].map((btn) => (
                    <Button
                      key={btn.type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddField(btn.type)}
                      className="border-[#D4C9B0] bg-[#FAF7F2] hover:bg-[#EDE8DC] hover:text-[#C41E3A] text-xs justify-start gap-2 cursor-pointer font-normal py-2 rounded-lg text-[#1A1008]"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-[#C41E3A]" />
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-serif font-bold uppercase text-[#6B5744] tracking-wider">
                    Questions Stack
                  </h3>
                  <Button
                    size="sm"
                    className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white text-[10px] h-6 cursor-pointer"
                    onClick={handleSaveFields}
                    disabled={saveFieldsMutation.isPending}
                  >
                    {saveFieldsMutation.isPending ? "Saving..." : "Save Questions"}
                  </Button>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[350px] pr-1">
                  {fields.length === 0 ? (
                    <div className="text-center text-xs text-[#6B5744] border border-dashed border-[#D4C9B0] p-8 rounded-lg">
                      No questions configured. Add some questions above.
                    </div>
                  ) : (
                    fields.map((field, idx) => {
                      const isSelected = selectedFieldIdx === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedFieldIdx(idx)}
                          className={`p-3 rounded-lg border text-left cursor-pointer flex items-center justify-between group transition-all ${
                            isSelected
                              ? "bg-[rgba(196,30,58,0.06)] border-[#C41E3A]"
                              : "bg-[#FAF7F2] border-[#D4C9B0] hover:bg-[#EDE8DC]"
                          }`}
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="text-[10px] text-[#C41E3A] font-serif font-bold mr-1.5">
                              {idx + 1}.
                            </span>
                            <span className="text-xs font-medium text-[#1A1008]">
                              {field.label}
                            </span>
                            <div className="text-[9px] text-[#6B5744] uppercase mt-0.5 font-mono">
                              {field.type}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-[#6B5744] hover:text-[#1A1008] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(idx, "up");
                              }}
                              disabled={idx === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-[#6B5744] hover:text-[#1A1008] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(idx, "down");
                              }}
                              disabled={idx === fields.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(idx);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Field Config options */}
              {selectedField && selectedFieldIdx !== null && (
                <div className="border-t border-[#D4C9B0] pt-6">
                  <h3 className="text-xs font-serif font-bold uppercase text-[#6B5744] tracking-wider mb-4">
                    Question Config
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#6B5744] text-xs">Question Label / Title</Label>
                      <Input
                        className="bg-[#FAF7F2] border-[#D4C9B0] text-xs text-[#1A1008]"
                        value={selectedField.label}
                        onChange={(e) =>
                          handleUpdateField(selectedFieldIdx, {
                            ...selectedField,
                            label: e.target.value,
                          })
                        }
                      />
                    </div>

                    {selectedField.type !== "select" && selectedField.type !== "checkbox" && (
                      <div className="space-y-1.5">
                        <Label className="text-[#6B5744] text-xs">Placeholder Text</Label>
                        <Input
                          className="bg-[#FAF7F2] border-[#D4C9B0] text-xs text-[#1A1008]"
                          value={selectedField.placeholder || ""}
                          onChange={(e) =>
                            handleUpdateField(selectedFieldIdx, {
                              ...selectedField,
                              placeholder: e.target.value || null,
                            })
                          }
                        />
                      </div>
                    )}

                    {/* Select/Checkbox Options */}
                    {(selectedField.type === "select" || selectedField.type === "checkbox") && (
                      <div className="space-y-2">
                        <Label className="text-[#6B5744] text-xs">Answer Options</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {(
                            (selectedField.options as Array<{ label: string; value: string }>) || []
                          ).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-1.5">
                              <Input
                                className="bg-[#FAF7F2] border-[#D4C9B0] text-xs text-[#1A1008] h-8"
                                value={opt.label}
                                onChange={(e) => {
                                  const updatedOpts = [...selectedField.options];
                                  updatedOpts[oIdx] = {
                                    label: e.target.value,
                                    value: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                                  };
                                  handleUpdateField(selectedFieldIdx, {
                                    ...selectedField,
                                    options: updatedOpts,
                                  });
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer shrink-0"
                                onClick={() => {
                                  const updatedOpts = selectedField.options.filter(
                                    (_: any, i: number) => i !== oIdx,
                                  );
                                  handleUpdateField(selectedFieldIdx, {
                                    ...selectedField,
                                    options: updatedOpts,
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] h-7 text-[#C41E3A] hover:text-[#8B1A2A] cursor-pointer p-0"
                          onClick={() => {
                            const updatedOpts = [
                              ...(selectedField.options || []),
                              {
                                label: `Option ${(selectedField.options || []).length + 1}`,
                                value: `opt_${Date.now()}`,
                              },
                            ];
                            handleUpdateField(selectedFieldIdx, {
                              ...selectedField,
                              options: updatedOpts,
                            });
                          }}
                        >
                          + Add Option
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#D4C9B0] pt-3">
                      <Label
                        className="text-[#1A1008] text-xs cursor-pointer"
                        htmlFor="required-toggle"
                      >
                        Required Question
                      </Label>
                      <Switch
                        id="required-toggle"
                        checked={selectedField.required}
                        onCheckedChange={(checked) =>
                          handleUpdateField(selectedFieldIdx, {
                            ...selectedField,
                            required: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Simulator Preview Panel */}
            <div className="flex-1 bg-[#F5F0E8] p-8 flex items-center justify-center overflow-y-auto">
              <div className="w-full max-w-xl flex flex-col gap-6 relative">
                <div className="absolute top-0 right-0">
                  <Badge
                    variant="outline"
                    className="border-[#D4C9B0] text-[#6B5744] bg-[#FAF7F2]/80 uppercase text-[10px]"
                  >
                    Live Simulator Preview
                  </Badge>
                </div>

                <div className="border border-[#D4C9B0] bg-[#FAF7F2] p-8 rounded-2xl shadow-none relative overflow-hidden">
                  {fields.length === 0 ? (
                    <div className="min-h-[250px] flex flex-col items-center justify-center text-center">
                      <Layout className="h-10 w-10 text-[#6B5744] mb-3" />
                      <p className="text-sm font-serif font-semibold text-[#1A1008]">
                        Your form simulator is empty
                      </p>
                      <p className="text-xs text-[#6B5744] max-w-xs mt-1">
                        Add form fields from the left config panel to start seeing live rendering.
                      </p>
                    </div>
                  ) : selectedField ? (
                    <div className="min-h-[250px] flex flex-col justify-center">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[#C41E3A] mb-2 font-serif">
                        Question {selectedFieldIdx! + 1} of {fields.length}
                      </div>

                      <label className="text-xl font-serif font-bold text-[#1A1008] mb-4 block">
                        {selectedField.label}
                        {selectedField.required && <span className="text-[#C41E3A] ml-1">*</span>}
                      </label>

                      {/* Render preview inputs */}
                      {selectedField.type === "short_text" && (
                        <Input
                          placeholder={selectedField.placeholder || ""}
                          className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] rounded-lg p-3 text-sm focus:border-[#C41E3A]"
                          disabled
                        />
                      )}

                      {selectedField.type === "long_text" && (
                        <textarea
                          placeholder={selectedField.placeholder || ""}
                          className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] rounded-lg p-3 text-sm focus:border-[#C41E3A] outline-none resize-none h-24"
                          disabled
                        />
                      )}

                      {selectedField.type === "email" && (
                        <Input
                          type="email"
                          placeholder={selectedField.placeholder || "name@example.com"}
                          className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] rounded-lg p-3 text-sm focus:border-[#C41E3A]"
                          disabled
                        />
                      )}

                      {selectedField.type === "number" && (
                        <Input
                          type="number"
                          placeholder={selectedField.placeholder || "0"}
                          className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] rounded-lg p-3 text-sm focus:border-[#C41E3A]"
                          disabled
                        />
                      )}

                      {selectedField.type === "date" && (
                        <Input
                          type="date"
                          className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] rounded-lg p-3 text-sm focus:border-[#C41E3A]"
                          disabled
                        />
                      )}

                      {selectedField.type === "rating" && (
                        <div className="flex items-center gap-1.5 mt-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className="text-2xl text-[#C41E3A]">
                              ★
                            </span>
                          ))}
                        </div>
                      )}

                      {selectedField.type === "select" && (
                        <div className="space-y-2 mt-2">
                          {(
                            (selectedField.options as Array<{ label: string; value: string }>) || []
                          ).map((o, oIdx) => (
                            <div
                              key={oIdx}
                              className="p-3 bg-[#FAF7F2] border border-[#D4C9B0] rounded-xl hover:border-[#C41E3A]/40 text-sm font-medium transition-all text-[#1A1008]"
                            >
                              <span className="text-[10px] text-[#C41E3A] font-serif font-bold uppercase mr-3">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {o.label}
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedField.type === "checkbox" && (
                        <div className="space-y-2 mt-2">
                          {(
                            (selectedField.options as Array<{ label: string; value: string }>) || []
                          ).map((o, oIdx) => (
                            <div
                              key={oIdx}
                              className="p-3 bg-[#FAF7F2] border border-[#D4C9B0] rounded-xl hover:border-[#C41E3A]/40 text-sm font-medium transition-all text-[#1A1008] flex items-center gap-3"
                            >
                              <div className="h-4 w-4 rounded border border-[#D4C9B0] bg-[#FAF7F2] shrink-0" />
                              {o.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: SETTINGS PANEL */}
          <TabsContent
            value="settings"
            className="flex-1 max-w-4xl mx-auto p-8 overflow-y-auto m-0 bg-[#F5F0E8]"
          >
            <Card className="border-[#D4C9B0] bg-[#FAF7F2] shadow-none p-6">
              <CardHeader className="p-0 pb-6 border-b border-[#D4C9B0] mb-6">
                <CardTitle className="text-2xl font-serif font-bold flex items-center gap-2 text-[#1A1008]">
                  <Settings2 className="h-6 w-6 text-[#C41E3A]" />
                  Form Configuration
                </CardTitle>
                <CardDescription className="text-[#6B5744]">
                  Manage metadata, availability thresholds, custom aliases, and premium styling
                  themes.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-[#6B5744] text-sm">
                        Form Title
                      </Label>
                      <Input
                        id="title"
                        className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] focus:border-[#C41E3A]"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="desc" className="text-[#6B5744] text-sm">
                        Description
                      </Label>
                      <textarea
                        id="desc"
                        className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] rounded-lg p-3 text-sm focus:border-[#C41E3A] outline-none resize-none h-24"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="customSlug" className="text-[#6B5744] text-sm">
                        Custom URL Slug (Optional)
                      </Label>
                      <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#D4C9B0] rounded-lg pl-3 overflow-hidden">
                        <span className="text-xs text-[#6B5744] font-mono">/forms/</span>
                        <Input
                          id="customSlug"
                          placeholder="my-feedback-form"
                          className="bg-transparent border-0 text-[#1A1008] placeholder-[#A89880] focus:ring-0 pl-0 focus:border-0 h-9"
                          value={customSlug}
                          onChange={(e) =>
                            setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status, Visibility, Theme */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="themeSelect" className="text-[#6B5744] text-sm">
                        Premium Layout Theme
                      </Label>
                      <select
                        id="themeSelect"
                        className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] rounded-lg p-2.5 focus:border-[#C41E3A] outline-none"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                      >
                        <option value="startup">Startup (Modern tech gradient)</option>
                        <option value="hogwarts">Hogwarts (Gold / Dark Magic)</option>
                        <option value="cyberpunk">Cyberpunk (Neon yellow / Black)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="statusSelect" className="text-[#6B5744] text-sm">
                        Publishing Status
                      </Label>
                      <select
                        id="statusSelect"
                        className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] rounded-lg p-2.5 focus:border-[#C41E3A] outline-none"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="draft">Draft (Creator view only)</option>
                        <option value="published">Published (Accepting responses)</option>
                        <option value="closed">Closed (No longer accepting responses)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="visibilitySelect" className="text-[#6B5744] text-sm">
                        Visibility Mode
                      </Label>
                      <select
                        id="visibilitySelect"
                        className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] rounded-lg p-2.5 focus:border-[#C41E3A] outline-none"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                      >
                        <option value="unlisted">Unlisted (Direct Link access only)</option>
                        <option value="public">Public (Searchable in explore gallery)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#D4C9B0] pt-6 space-y-6">
                  <h3 className="text-sm font-serif font-bold uppercase text-[#6B5744] tracking-wider">
                    Response Limits & Expirations
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Limit responses */}
                    <div className="p-4 rounded-xl border border-[#D4C9B0] bg-[#EDE8DC]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="enableLimit"
                          className="text-[#1A1008] text-sm cursor-pointer"
                        >
                          Restrict Response Count
                        </Label>
                        <Switch
                          id="enableLimit"
                          checked={enableLimit}
                          onCheckedChange={setEnableLimit}
                        />
                      </div>
                      {enableLimit && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <Label className="text-[#6B5744] text-xs">
                            Maximum Allowed Submissions
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] focus:border-[#C41E3A]"
                            value={responseLimit}
                            onChange={(e) => setResponseLimit(Number(e.target.value))}
                          />
                        </div>
                      )}
                    </div>

                    {/* Expiry Date */}
                    <div className="p-4 rounded-xl border border-[#D4C9B0] bg-[#EDE8DC]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="enableExpiry"
                          className="text-[#1A1008] text-sm cursor-pointer"
                        >
                          Set Expiration Date
                        </Label>
                        <Switch
                          id="enableExpiry"
                          checked={enableExpiry}
                          onCheckedChange={setEnableExpiry}
                        />
                      </div>
                      {enableExpiry && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <Label className="text-[#6B5744] text-xs">Closing Date</Label>
                          <Input
                            type="date"
                            className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] focus:border-[#C41E3A]"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code + Share Link Section */}
                <div className="border-t border-[#D4C9B0] pt-6 space-y-4">
                  <h3 className="text-sm font-serif font-bold uppercase text-[#6B5744] tracking-wider flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-[#C41E3A]" />
                    Share &amp; QR Code
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-3">
                      <p className="text-xs text-[#6B5744]">
                        Share your form via link or QR code for instant mobile access.
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={formShareUrl}
                          className="bg-[#FAF7F2] border-[#D4C9B0] text-[#6B5744] text-xs font-mono"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={handleCopyLink}
                          className="border-[#D4C9B0] bg-[#FAF7F2] hover:bg-[#EDE8DC] cursor-pointer shrink-0"
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4 text-[#1A1008]" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-white rounded-xl shadow-md border border-[#D4C9B0]">
                        <QRCodeSVG
                          value={formShareUrl}
                          size={120}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          level="M"
                        />
                      </div>
                      <p className="text-[10px] text-[#6B5744]">Scan to open form on mobile</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-[#D4C9B0]">
                  <Button
                    type="submit"
                    className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium cursor-pointer flex items-center gap-2"
                    disabled={updateFormMutation.isPending}
                  >
                    {updateFormMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>

            {/* PASSWORD PROTECTION CARD */}
            <Card className="border-[#D4C9B0] bg-[#FAF7F2] shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#C41E3A]" />
                  <CardTitle className="text-base font-serif text-[#1A1008]">
                    Password Protection
                  </CardTitle>
                </div>
                <CardDescription className="text-[#6B5744] text-xs">
                  Require respondents to enter a password before viewing this form.
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 space-y-4">
                {isPasswordProtected ? (
                  <div className="flex items-center justify-between bg-[rgba(196,30,58,0.06)] border border-[#C41E3A]/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#C41E3A]" />
                      <span className="text-sm font-medium text-[#1A1008]">
                        Password protection is active
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#C41E3A]/40 text-[#C41E3A] hover:bg-[#C41E3A]/5 cursor-pointer"
                      onClick={handleRemovePassword}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Remove Password"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#6B5744]">New Password</Label>
                      <Input
                        type="password"
                        placeholder="Minimum 4 characters"
                        className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] text-sm focus:border-[#C41E3A]"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#6B5744]">Confirm Password</Label>
                      <Input
                        type="password"
                        placeholder="Repeat password"
                        className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] text-sm focus:border-[#C41E3A]"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                      />
                    </div>
                    <Button
                      className="bg-[#1A1008] hover:bg-[#6B5744] text-white cursor-pointer flex items-center gap-2"
                      onClick={handleSavePassword}
                      disabled={passwordSaving || !passwordInput}
                    >
                      {passwordSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      Enable Password Protection
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: RESPONSES PANEL */}
          <TabsContent
            value="responses"
            className="flex-1 max-w-6xl mx-auto p-8 overflow-y-auto m-0 bg-[#F5F0E8]"
          >
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#1A1008]">
                    Response Submissions
                  </h2>
                  <p className="text-[#6B5744] text-sm">
                    Browse and inspect individual form submissions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCompletedOnly(!completedOnly);
                      setResponsesPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border cursor-pointer transition-colors ${
                      completedOnly
                        ? "bg-[#C41E3A]/10 border-[#C41E3A]/30 text-[#C41E3A]"
                        : "bg-[#FAF7F2] border-[#D4C9B0] text-[#6B5744]"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {completedOnly ? "Completed Only" : "All Responses"}
                  </button>
                  <Button
                    onClick={handleDownloadCsv}
                    size="sm"
                    className="bg-[#1A1008] hover:bg-[#6B5744] text-[#FAF7F2] cursor-pointer flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {responsesLoading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
                </div>
              ) : responsesData && responsesData.responses.length > 0 ? (
                <div className="space-y-3">
                  {responsesData.responses.map((response) => (
                    <Card
                      key={response.id}
                      className="border-[#D4C9B0] bg-[#FAF7F2] shadow-none overflow-hidden"
                    >
                      <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#EDE8DC] transition-colors"
                        onClick={() =>
                          setExpandedResponseId(
                            expandedResponseId === response.id ? null : response.id,
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          {response.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-[#A89880] shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {response.respondentEmail ? (
                                <span className="text-sm font-medium text-[#1A1008] flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-[#C41E3A]" />
                                  {response.respondentEmail}
                                </span>
                              ) : (
                                <span className="text-sm text-[#A89880] italic">Anonymous</span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B5744] mt-0.5">
                              {response.submittedAt
                                ? new Date(response.submittedAt).toLocaleString()
                                : "Not submitted"}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 text-[#A89880] transition-transform ${expandedResponseId === response.id ? "rotate-90" : ""}`}
                        />
                      </div>

                      {expandedResponseId === response.id && (
                        <div className="border-t border-[#D4C9B0] px-4 py-3 bg-[#F5F0E8] space-y-2">
                          {responsesData.fields.map((field) => {
                            const ans = response.answers.find(
                              (a) => a.fieldId === field.id,
                            )?.answer;
                            const displayAns =
                              ans === undefined || ans === null ? (
                                <span className="text-[#A89880] italic">No answer</span>
                              ) : Array.isArray(ans) ? (
                                ans.join(", ")
                              ) : (
                                String(ans)
                              );

                            return (
                              <div key={field.id} className="flex gap-3">
                                <span className="text-xs font-medium text-[#6B5744] min-w-[120px] truncate shrink-0">
                                  {field.label}:
                                </span>
                                <span className="text-xs text-[#1A1008] flex-1">{displayAns}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  ))}

                  {/* Pagination */}
                  {responsesData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-[#6B5744]">
                        Showing {(responsesPage - 1) * 20 + 1}–
                        {Math.min(responsesPage * 20, responsesData.pagination.total)} of{" "}
                        {responsesData.pagination.total} responses
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-[#D4C9B0] text-[#6B5744] cursor-pointer"
                          onClick={() => setResponsesPage((p) => Math.max(1, p - 1))}
                          disabled={responsesPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-[#6B5744]">
                          Page {responsesPage} / {responsesData.pagination.totalPages}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-[#D4C9B0] text-[#6B5744] cursor-pointer"
                          onClick={() =>
                            setResponsesPage((p) =>
                              Math.min(responsesData.pagination.totalPages, p + 1),
                            )
                          }
                          disabled={responsesPage >= responsesData.pagination.totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-[#6B5744] border border-dashed border-[#D4C9B0] rounded-xl bg-[#FAF7F2]">
                  <Users2 className="h-8 w-8 mx-auto mb-3 text-[#A89880]" />
                  <p className="font-serif font-semibold text-[#1A1008]">No responses yet</p>
                  <p className="text-sm mt-1">
                    Once people fill out this form, their submissions will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent
            value="analytics"
            className="flex-1 max-w-6xl mx-auto p-8 overflow-y-auto m-0 bg-[#F5F0E8]"
          >
            {analyticsLoading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Header info & export */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#1A1008]">
                      Analytics Report
                    </h2>
                    <p className="text-[#6B5744] text-sm">
                      Response rates, funnel drops, and answer aggregates.
                    </p>
                  </div>

                  <Button
                    onClick={handleDownloadCsv}
                    className="bg-[#1A1008] hover:bg-[#6B5744] text-[#FAF7F2] font-medium cursor-pointer flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export CSV (Streamed)
                  </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 flex flex-col justify-between shadow-none border-t-4 border-t-[#1A1008]">
                    <span className="text-[#6B5744] text-xs font-semibold uppercase tracking-wider">
                      Total Responses
                    </span>
                    <span className="text-4xl font-extrabold text-[#1A1008] mt-2">
                      {analytics.summary.totalResponses}
                    </span>
                    <span className="text-[10px] text-[#6B5744] mt-1">
                      Including partial & draft progress
                    </span>
                  </Card>

                  <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 flex flex-col justify-between shadow-none border-t-4 border-t-[#C41E3A]">
                    <span className="text-[#6B5744] text-xs font-semibold uppercase tracking-wider">
                      Completed Responses
                    </span>
                    <span className="text-4xl font-extrabold text-[#C41E3A] mt-2">
                      {analytics.summary.completedResponses}
                    </span>
                    <span className="text-[10px] text-[#6B5744] mt-1">
                      Fully answered all required questions
                    </span>
                  </Card>

                  <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 flex flex-col justify-between shadow-none border-t-4 border-t-[#A89880]">
                    <span className="text-[#6B5744] text-xs font-semibold uppercase tracking-wider">
                      Completion Rate
                    </span>
                    <span className="text-4xl font-extrabold text-[#1A1008] mt-2">
                      {analytics.summary.completionRate.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-[#6B5744] mt-1">
                      Ratio of completed to total views
                    </span>
                  </Card>
                </div>

                {/* Response Timeline Chart */}
                <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-6 shadow-none">
                  <h3 className="text-sm font-serif font-semibold uppercase text-[#6B5744] tracking-wider mb-4">
                    Response Timeline (Submissions Over Time)
                  </h3>

                  <div className="h-80 w-full mt-2">
                    {analytics.timeline && analytics.timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.timeline}
                          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DC" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#6B5744"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "#D4C9B0" }}
                          />
                          <YAxis
                            stroke="#6B5744"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: "#FAF7F2",
                              borderColor: "#D4C9B0",
                              color: "#1A1008",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#C41E3A"
                            strokeWidth={2}
                            dot={{ fill: "#C41E3A", strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#6B5744]">
                        No submissions recorded to generate a timeline.
                      </div>
                    )}
                  </div>
                </Card>

                {/* Funnel Drop-off Chart */}
                <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-6 shadow-none">
                  <h3 className="text-sm font-serif font-semibold uppercase text-[#6B5744] tracking-wider mb-4">
                    Respondent Funnel & Drop-off (Drop rate per step)
                  </h3>

                  <div className="h-80 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.funnel}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <XAxis
                          dataKey="label"
                          stroke="#6B5744"
                          fontSize={11}
                          tickFormatter={(t) => t.substring(0, 15) + (t.length > 15 ? "..." : "")}
                        />
                        <YAxis
                          stroke="#6B5744"
                          fontSize={11}
                          label={{
                            value: "Users Reached",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#6B5744",
                          }}
                        />
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: "#FAF7F2",
                            borderColor: "#D4C9B0",
                            color: "#1A1008",
                          }}
                          cursor={{ fill: "rgba(196, 30, 58, 0.03)" }}
                        />
                        <Bar dataKey="reached" fill="#C41E3A" radius={[6, 6, 0, 0]}>
                          {analytics.funnel.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Choice Distributions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(analytics.distributions).map(([fieldId, optionsArr_]) => {
                    const optionsArr = (optionsArr_ ?? []) as { option: string; count: number }[];
                    const fieldLabel =
                      fields.find((f) => f.id === fieldId)?.label || "Question Option Chart";

                    return (
                      <Card
                        key={fieldId}
                        className="border-[#D4C9B0] bg-[#FAF7F2] p-6 flex flex-col shadow-none"
                      >
                        <h4 className="text-xs font-serif font-semibold uppercase text-[#6B5744] tracking-wider mb-4 line-clamp-1">
                          {fieldLabel}
                        </h4>

                        <div className="h-64 w-full flex-grow flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={optionsArr}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name} (${(percent * 100).toFixed(0)}%)`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="option"
                              >
                                {optionsArr.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <ChartTooltip
                                contentStyle={{
                                  backgroundColor: "#FAF7F2",
                                  borderColor: "#D4C9B0",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#6B5744]">No analytics data available.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
