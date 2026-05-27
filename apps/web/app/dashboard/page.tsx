"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { clearSessionToken } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  LogOut,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Lock,
  Globe,
  Sparkles,
  Layers,
  Search,
  Compass,
  Archive,
  ArchiveRestore,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormTheme, setNewFormTheme] = useState("startup");
  const [newFormVisibility, setNewFormVisibility] = useState<"public" | "unlisted">("unlisted");
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // 1. Auth check
  const {
    data: user,
    error: authError,
    isLoading: userLoading,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  // Redirect to login if unauthorized
  useEffect(() => {
    if (authError) {
      toast.error("Please log in to access the dashboard.");
      router.push("/auth/login");
    }
  }, [authError, router]);

  // 2. Fetch forms
  const { data: forms, isLoading: formsLoading } = trpc.form.getForms.useQuery(undefined, {
    enabled: !!user,
  });

  // 2b. Fetch archived forms
  const { data: archivedForms, isLoading: archivedLoading } = trpc.form.getArchivedForms.useQuery(
    undefined,
    {
      enabled: !!user && showArchived,
    },
  );

  // 3. Mutations
  const createFormMutation = trpc.form.createForm.useMutation({
    onSuccess: (newForm) => {
      toast.success("Form created successfully!");
      setCreateDialogOpen(false);
      setNewFormTitle("");
      utils.form.getForms.invalidate();
      router.push(`/dashboard/forms/${newForm.id}/edit`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create form.");
    },
  });

  const cloneFormMutation = trpc.form.cloneForm.useMutation({
    onSuccess: () => {
      toast.success("Form cloned successfully!");
      utils.form.getForms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to clone form.");
    },
  });

  const deleteFormMutation = trpc.form.deleteForm.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully!");
      utils.form.getForms.invalidate();
      utils.form.getArchivedForms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete form.");
    },
  });

  const archiveFormMutation = trpc.form.archiveForm.useMutation({
    onSuccess: () => {
      toast.success("Form archived.");
      utils.form.getForms.invalidate();
      utils.form.getArchivedForms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to archive form.");
    },
  });

  const unarchiveFormMutation = trpc.form.unarchiveForm.useMutation({
    onSuccess: () => {
      toast.success("Form restored from archive.");
      utils.form.getForms.invalidate();
      utils.form.getArchivedForms.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to restore form.");
    },
  });

  const handleLogout = () => {
    clearSessionToken();
    toast.success("Logged out successfully.");
    router.push("/auth/login");
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) {
      toast.error("Form title is required.");
      return;
    }
    createFormMutation.mutate({
      title: newFormTitle,
      theme: newFormTheme,
      visibility: newFormVisibility,
    });
  };

  const copyFormLink = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/forms/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Shareable form link copied to clipboard!");
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Skeleton header */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-[#EDE8DC] rounded animate-pulse" />
            <div className="h-9 w-24 bg-[#EDE8DC] rounded-lg animate-pulse" />
          </div>
          {/* Skeleton search bar */}
          <div className="h-10 w-full max-w-xs bg-[#EDE8DC] rounded-lg animate-pulse" />
          {/* Skeleton form cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-2/3 bg-[#EDE8DC] rounded animate-pulse" />
                  <div className="h-5 w-16 bg-[#EDE8DC] rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-full bg-[#EDE8DC] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-[#EDE8DC] rounded animate-pulse" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-8 w-16 bg-[#EDE8DC] rounded animate-pulse" />
                  <div className="h-8 w-16 bg-[#EDE8DC] rounded animate-pulse" />
                  <div className="h-8 w-16 bg-[#EDE8DC] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeForms = forms?.filter(
    (form) =>
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredArchived = archivedForms?.filter(
    (form) =>
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const displayForms = showArchived ? filteredArchived : activeForms;
  const isLoadingForms = showArchived ? archivedLoading : formsLoading;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] selection:bg-[rgba(196,30,58,0.15)] selection:text-[#1A1008]">
      {/* Premium Header */}
      <header className="border-b border-[#D4C9B0] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#C41E3A] flex items-center justify-center font-bold text-white shadow-none">
              F
            </div>
            <span className="text-xl font-serif font-bold text-[#1A1008]">FinalForms</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/explore">
              <Button
                variant="ghost"
                className="text-[#6B5744] hover:text-[#1A1008] flex items-center gap-2 cursor-pointer"
              >
                <Compass className="h-4 w-4 text-[#C41E3A]" />
                Explore
              </Button>
            </Link>

            {/* Admin Panel link — only for admin users */}
            {user.isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-[#C41E3A] hover:text-[#8B1A2A] flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}

            <div className="h-8 w-px bg-[#D4C9B0]" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#6B5744] hidden sm:inline">
                {user.fullName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-[#6B5744] hover:text-[#C41E3A] cursor-pointer"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1008]">
              {showArchived ? "Archived Forms" : "Your Forms"}
            </h1>
            <p className="text-[#6B5744] text-sm mt-1">
              {showArchived
                ? "These forms are archived. Restore them to make them active again."
                : "Create, design, and analyze response flows for your forms."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow md:flex-grow-0 md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B5744]" />
              <Input
                placeholder="Search forms..."
                className="pl-9 bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] placeholder-[#A89880] focus:border-[#C41E3A]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Archive toggle */}
            <Button
              variant="outline"
              className={`border-[#D4C9B0] cursor-pointer flex items-center gap-1.5 shrink-0 ${showArchived ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-[#FAF7F2] text-[#6B5744]"}`}
              onClick={() => setShowArchived(!showArchived)}
              title={showArchived ? "View active forms" : "View archived forms"}
            >
              {showArchived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{showArchived ? "Active Forms" : "Archived"}</span>
            </Button>

            {!showArchived && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                New Form
              </Button>
            )}
          </div>
        </div>

        {/* Forms Grid */}
        {isLoadingForms ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card
                key={n}
                className="border-[#D4C9B0] bg-[#FAF7F2]/60 h-48 animate-pulse shadow-none"
              />
            ))}
          </div>
        ) : displayForms && displayForms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayForms.map((form) => {
              const themeBadgeColor =
                form.theme === "hogwarts"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : form.theme === "cyberpunk"
                    ? "bg-yellow-600/10 text-yellow-700 border-yellow-600/20"
                    : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";

              return (
                <Card
                  key={form.id}
                  className={`border-[#D4C9B0] bg-[#FAF7F2] hover:bg-[#EDE8DC] hover:border-[#C41E3A]/40 transition-all duration-200 flex flex-col justify-between group overflow-hidden relative shadow-none ${form.isArchived ? "opacity-75" : ""}`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`${themeBadgeColor} uppercase text-[10px] tracking-wider px-2 py-0.5 shadow-none`}
                        >
                          {form.theme}
                        </Badge>
                        {(form as any).isPasswordProtected && (
                          <Badge
                            variant="outline"
                            className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[9px] px-1.5 uppercase tracking-wider flex items-center gap-0.5"
                          >
                            <Lock className="h-2.5 w-2.5" />
                            PW
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {form.visibility === "public" ? (
                          <span
                            className="text-[#6B5744] text-xs flex items-center gap-1"
                            title="Publicly searchable"
                          >
                            <Globe className="h-3 w-3 text-[#C41E3A]" />
                            Public
                          </span>
                        ) : (
                          <span
                            className="text-[#6B5744] text-xs flex items-center gap-1"
                            title="Only viewable via link"
                          >
                            <Lock className="h-3 w-3" />
                            Unlisted
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 shadow-none capitalize ${
                            form.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : form.isArchived
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-neutral-500/10 text-[#6B5744] border-neutral-500/20"
                          }`}
                        >
                          {form.isArchived ? "archived" : form.status}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-serif font-bold group-hover:text-[#C41E3A] transition-colors line-clamp-1 text-[#1A1008]">
                      {form.title}
                    </CardTitle>
                    <CardDescription className="text-[#6B5744] text-xs line-clamp-2 mt-1">
                      {form.description || "No description set for this form."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 py-2 flex items-center justify-between text-xs text-[#6B5744] border-t border-[#D4C9B0]/40">
                    <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                  </CardContent>

                  <div className="bg-[#EDE8DC] p-3 px-5 flex items-center justify-between gap-2 border-t border-[#D4C9B0]">
                    {showArchived ? (
                      /* Archived view: Restore + Delete */
                      <div className="flex items-center gap-2 w-full">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[#6B5744] hover:text-[#1A1008] cursor-pointer flex items-center gap-1.5 p-1"
                          onClick={() => unarchiveFormMutation.mutate({ id: form.id })}
                          disabled={unarchiveFormMutation.isPending}
                          title="Restore from archive"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          Restore
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer ml-auto"
                          onClick={() => {
                            if (
                              confirm(
                                "Permanently delete this archived form? All responses will be lost.",
                              )
                            ) {
                              deleteFormMutation.mutate({ id: form.id });
                            }
                          }}
                          title="Delete Permanently"
                          disabled={deleteFormMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      /* Active view: Edit, Copy, Open, Clone, Archive, Delete */
                      <>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/forms/${form.id}/edit`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-[#6B5744] hover:text-[#1A1008] cursor-pointer flex items-center gap-1.5 p-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyFormLink(form.id)}
                            className="h-8 text-[#6B5744] hover:text-[#1A1008] cursor-pointer p-1"
                            title="Copy shareable link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>

                          <Link href={`/forms/${form.id}`} target="_blank">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-[#6B5744] hover:text-[#1A1008] cursor-pointer p-1"
                              title="Open live form"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer"
                            onClick={() => cloneFormMutation.mutate({ id: form.id })}
                            title="Clone Form"
                            disabled={cloneFormMutation.isPending}
                          >
                            <Layers className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#6B5744] hover:text-amber-600 cursor-pointer"
                            onClick={() => archiveFormMutation.mutate({ id: form.id })}
                            title="Archive Form"
                            disabled={archiveFormMutation.isPending}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this form? All responses will be permanently removed.",
                                )
                              ) {
                                deleteFormMutation.mutate({ id: form.id });
                              }
                            }}
                            title="Delete Form"
                            disabled={deleteFormMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-[#D4C9B0] rounded-2xl bg-[#FAF7F2] p-8 text-center shadow-none">
            <div className="p-4 bg-[rgba(196,30,58,0.06)] rounded-full border border-[#C41E3A]/20 text-[#C41E3A] mb-4">
              {showArchived ? <Archive className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1008]">
              {showArchived ? "No archived forms" : "No forms found"}
            </h3>
            <p className="text-[#6B5744] text-sm max-w-sm mt-1">
              {showArchived
                ? "You have no archived forms. Archive a form from the active dashboard to see it here."
                : "You haven't created any forms yet, or no forms matched your search. Get started by creating one!"}
            </p>
            {!showArchived && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-5 bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium cursor-pointer flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Form
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Create Form Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#1A1008]">
              Create New Form
            </DialogTitle>
            <DialogDescription className="text-[#6B5744]">
              Initialize a premium Typeform-style conversational form.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateForm} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="formTitle" className="text-[#6B5744]">
                Form Title
              </Label>
              <Input
                id="formTitle"
                placeholder="e.g., Summer Event Feedback"
                className="bg-[#FAF7F2] border-[#D4C9B0] text-[#1A1008] focus:border-[#C41E3A]"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formTheme" className="text-[#6B5744]">
                Premium Theme Layout
              </Label>
              <select
                id="formTheme"
                className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] rounded-lg p-2 focus:border-[#C41E3A] outline-none"
                value={newFormTheme}
                onChange={(e) => setNewFormTheme(e.target.value)}
              >
                <option value="startup">Startup (Modern tech gradient)</option>
                <option value="hogwarts">Hogwarts (Gold / Dark Magic)</option>
                <option value="cyberpunk">Cyberpunk (Neon yellow / Black)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formVisibility" className="text-[#6B5744]">
                Visibility
              </Label>
              <select
                id="formVisibility"
                className="w-full bg-[#FAF7F2] border border-[#D4C9B0] text-[#1A1008] rounded-lg p-2 focus:border-[#C41E3A] outline-none"
                value={newFormVisibility}
                onChange={(e) => setNewFormVisibility(e.target.value as any)}
              >
                <option value="unlisted">Unlisted (Accessible only via direct link)</option>
                <option value="public">Public (Visible in public gallery)</option>
              </select>
            </div>

            <DialogFooter className="pt-4 border-t border-[#D4C9B0]/50 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateDialogOpen(false)}
                className="text-[#6B5744] hover:text-[#1A1008] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white font-medium cursor-pointer shadow-none"
                disabled={createFormMutation.isPending}
              >
                {createFormMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Form"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
