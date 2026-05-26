"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { Compass, Search, Sparkles, ArrowLeft, ArrowRight, Copy, Lock, Loader2 } from "lucide-react";

export default function ExplorePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: publicForms, isLoading } = trpc.form.getPublicExploreForms.useQuery();

  // Check if user is logged in (to show the "Use as Template" button)
  const { data: user } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  const cloneFormMutation = trpc.form.cloneForm.useMutation({
    onSuccess: (cloned) => {
      utils.form.getForms.invalidate();
      toast.success("Template imported! Opening editor...");
      router.push(`/dashboard/forms/${cloned.id}/edit`);

    },
    onError: (err) => {
      toast.error(err.message || "Failed to import template.");
    },
  });

  const filteredForms = publicForms?.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] selection:bg-[rgba(196,30,58,0.15)] selection:text-[#1A1008]">

      {/* Navigation Header */}
      <header className="border-b border-[#D4C9B0] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-6 w-px bg-[#D4C9B0]" />
            <span className="text-lg font-serif font-bold text-[#1A1008]">
              FinalForms Gallery &amp; Templates
            </span>
          </div>

          <Link href="/dashboard">
            <Button size="sm" className="bg-[#C41E3A] hover:bg-[#8B1A2A] text-white">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-4">
          <div className="inline-flex p-3 bg-[rgba(196,30,58,0.06)] rounded-full border border-[rgba(196,30,58,0.15)] text-[#C41E3A] mb-2">
            <Compass className="h-7 w-7 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div className="flex justify-center">
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-[#1A1008] pl-3 border-l-4 border-[#C41E3A] text-left">
              Explore &amp; Use Templates
            </h1>
          </div>
          <p className="text-[#6B5744] text-sm leading-relaxed">
            Discover community-designed forms. Click <strong>"Use as Template"</strong> to instantly import any form into your dashboard as a draft.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto pt-4">
            <Search className="absolute left-3.5 top-7.5 h-4 w-4 text-[#A89880]" />
            <Input
              placeholder="Search public forms..."
              className="pl-10 bg-[#FAF7F2] border-[#D4C9B0]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border-[#D4C9B0] bg-[#FAF7F2] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-[#EDE8DC] rounded-full animate-pulse" />
                  <div className="h-4 w-12 bg-[#EDE8DC] rounded-full animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-[#EDE8DC] rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-[#EDE8DC] rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-[#EDE8DC] rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-[#EDE8DC] rounded-lg animate-pulse mt-2" />
              </Card>
            ))}
          </div>
        ) : filteredForms && filteredForms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map((form) => {
              const themeBadgeColor =
                form.theme === "hogwarts"
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  : form.theme === "cyberpunk"
                    ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    : "bg-[#C41E3A]/5 text-[#C41E3A] border-[#C41E3A]/20";

              const isCloning = cloneFormMutation.isPending && cloneFormMutation.variables?.id === form.id;

              return (
                <Card
                  key={form.id}
                  className="border-[#D4C9B0] bg-[#FAF7F2] hover:border-[#C41E3A] transition-all duration-200 flex flex-col justify-between group overflow-hidden relative shadow-none hover:shadow-[0_12px_24px_rgba(26,16,8,0.04)]"
                >
                  <CardHeader className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`${themeBadgeColor} uppercase text-[9px] tracking-wider px-2`}>
                          {form.theme}
                        </Badge>
                        {form.isPasswordProtected && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[9px] px-1.5 uppercase tracking-wider flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            Protected
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-[#6B5744]">
                        By {form.creatorName}
                      </span>
                    </div>

                    <CardTitle className="text-base font-serif font-bold text-[#1A1008] group-hover:text-[#C41E3A] transition-colors line-clamp-1">
                      {form.title}
                    </CardTitle>
                    <CardDescription className="text-[#6B5744] text-xs line-clamp-2 mt-1.5 leading-relaxed">
                      {form.description || "No description set for this public form."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 pb-5 pt-0 flex flex-col gap-2">
                    {/* Use as Template button — shown to logged-in users */}
                    {user && (
                      <Button
                        variant="outline"
                        className="w-full border-[#D4C9B0] bg-[#FAF7F2] hover:bg-[rgba(196,30,58,0.06)] hover:border-[#C41E3A] hover:text-[#C41E3A] text-[#6B5744] text-xs cursor-pointer"
                        onClick={() => cloneFormMutation.mutate({ id: form.id })}
                        disabled={isCloning}
                      >
                        {isCloning ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Importing...</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5 mr-1" />Use as Template</>
                        )}
                      </Button>
                    )}
                    <Link href={`/forms/${form.id}`}>
                      <Button className="w-full bg-[#C41E3A] hover:bg-[#8B1A2A] text-white">
                        Fill Form
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-5 bg-[rgba(196,30,58,0.06)] border border-[rgba(196,30,58,0.15)] rounded-full text-[#C41E3A] mb-2">
              <Search className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1008]">No forms found</h3>
            <p className="text-sm text-[#6B5744] max-w-xs leading-relaxed">
              {searchQuery
                ? `No public forms match "${searchQuery}". Try a different search term.`
                : "No public forms have been published yet. Be the first to create one!"}
            </p>
            <Link href="/dashboard">
              <Button className="mt-2 bg-[#C41E3A] hover:bg-[#8B1A2A] text-white">
                <Sparkles className="h-4 w-4" />
                Create Your First Form
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
