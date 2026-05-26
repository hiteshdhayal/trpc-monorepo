"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Users,
  FileText,
  Activity,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Crown,
  BarChart2,
  CheckCircle2,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: user, error: authError, isLoading: userLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  // Redirect non-admins
  useEffect(() => {
    if (authError) {
      router.push("/auth/login");
      return;
    }
    if (user && !user.isAdmin) {
      toast.error("Admin access required.");
      router.push("/dashboard");
    }
  }, [user, authError, router]);

  const [usersPage, setUsersPage] = useState(1);
  const [formsPage, setFormsPage] = useState(1);

  // Stats
  const { data: stats, isLoading: statsLoading } = trpc.admin.getSystemStats.useQuery(undefined, {
    enabled: !!user?.isAdmin,
    refetchInterval: 30000,
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery(
    { page: usersPage, limit: 20 },
    { enabled: !!user?.isAdmin }
  );

  // Forms
  const { data: formsData, isLoading: formsLoading } = trpc.admin.getAllForms.useQuery(
    { page: formsPage, limit: 20 },
    { enabled: !!user?.isAdmin }
  );

  // Delete user mutation
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully.");
      utils.admin.getAllUsers.invalidate();
      utils.admin.getSystemStats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete user.");
    },
  });

  // Delete form mutation
  const deleteFormMutation = trpc.admin.deleteForm.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully.");
      utils.admin.getAllForms.invalidate();
      utils.admin.getSystemStats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete form.");
    },
  });

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
      </div>
    );
  }

  if (!user.isAdmin) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1A1008] selection:bg-[rgba(196,30,58,0.15)]">
      {/* Header */}
      <header className="border-b border-[#D4C9B0] bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-[#6B5744] hover:text-[#1A1008]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-6 w-px bg-[#D4C9B0]" />
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#C41E3A]" />
              <span className="text-lg font-serif font-bold text-[#1A1008]">Admin Control Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20 flex items-center gap-1.5 px-2 py-1">
              <Crown className="h-3 w-3" />
              {user.fullName}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Stats Row */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-[#FAF7F2] border border-[#D4C9B0] rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 shadow-none border-t-4 border-t-[#C41E3A]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#C41E3A]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Total Users</span>
              </div>
              <p className="text-3xl font-extrabold text-[#1A1008]">{stats.totalUsers}</p>
            </Card>
            <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 shadow-none border-t-4 border-t-[#1A1008]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-[#1A1008]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Total Forms</span>
              </div>
              <p className="text-3xl font-extrabold text-[#1A1008]">{stats.totalForms}</p>
            </Card>
            <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 shadow-none border-t-4 border-t-[#6B5744]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-[#6B5744]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Total Responses</span>
              </div>
              <p className="text-3xl font-extrabold text-[#1A1008]">{stats.totalResponses}</p>
            </Card>
            <Card className="border-[#D4C9B0] bg-[#FAF7F2] p-5 shadow-none border-t-4 border-t-[#A89880]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-[#A89880]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Completed</span>
              </div>
              <p className="text-3xl font-extrabold text-[#1A1008]">{stats.completedResponses}</p>
              <p className="text-[10px] text-[#6B5744] mt-0.5">
                {stats.totalResponses > 0
                  ? `${((stats.completedResponses / stats.totalResponses) * 100).toFixed(0)}% completion rate`
                  : "No data"}
              </p>
            </Card>
          </div>
        ) : null}

        {/* Tabs: Users | Forms */}
        <Tabs defaultValue="users">
          <TabsList className="bg-[#EDE8DC] border border-[#D4C9B0] p-0.5 rounded-lg mb-6">
            <TabsTrigger value="users" className="text-xs px-4 py-1.5 cursor-pointer flex items-center gap-1.5 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white text-[#6B5744] data-[state=active]:shadow-none">
              <Users className="h-3.5 w-3.5" />
              Users
              {usersData && (
                <span className="ml-1 bg-white/20 text-[10px] px-1 rounded">
                  {usersData.pagination.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forms" className="text-xs px-4 py-1.5 cursor-pointer flex items-center gap-1.5 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white text-[#6B5744] data-[state=active]:shadow-none">
              <FileText className="h-3.5 w-3.5" />
              Forms
              {formsData && (
                <span className="ml-1 bg-white/20 text-[10px] px-1 rounded">
                  {formsData.pagination.total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            {usersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-14 bg-[#FAF7F2] border border-[#D4C9B0] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : usersData && usersData.users.length > 0 ? (
              <div className="space-y-4">
                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-[#D4C9B0] bg-[#FAF7F2] shadow-none">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#D4C9B0] bg-[#EDE8DC]">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Email</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Role</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Forms</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Joined</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.users.map((u, idx) => (
                        <tr
                          key={u.id}
                          className={`border-b border-[#D4C9B0]/40 hover:bg-[#EDE8DC]/50 transition-colors ${idx % 2 === 0 ? "" : "bg-[#FAF7F2]"}`}
                        >
                          <td className="px-4 py-3 font-medium text-[#1A1008]">{u.fullName}</td>
                          <td className="px-4 py-3 text-[#6B5744] text-xs">{u.email}</td>
                          <td className="px-4 py-3 text-center">
                            {u.isAdmin ? (
                              <Badge variant="outline" className="bg-[#C41E3A]/10 text-[#C41E3A] border-[#C41E3A]/20 text-[9px] flex items-center gap-1 w-fit mx-auto">
                                <Crown className="h-2.5 w-2.5" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-neutral-100 text-neutral-500 border-neutral-200 text-[9px] w-fit mx-auto">
                                Creator
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-[#1A1008] font-semibold">{u.formCount}</td>
                          <td className="px-4 py-3 text-[#6B5744] text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer"
                              disabled={u.id === user.id || deleteUserMutation.isPending}
                              title={u.id === user.id ? "Cannot delete yourself" : "Delete user"}
                              onClick={() => {
                                if (confirm(`Delete user "${u.fullName}" (${u.email})? This will also delete all their forms and responses.`)) {
                                  deleteUserMutation.mutate({ userId: u.id });
                                }
                              }}
                            >
                              {deleteUserMutation.isPending && deleteUserMutation.variables?.userId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#6B5744]">
                      Page {usersPage} of {usersData.pagination.totalPages} ({usersData.pagination.total} users)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 border-[#D4C9B0] text-[#6B5744] cursor-pointer"
                        onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                        disabled={usersPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 border-[#D4C9B0] text-[#6B5744] cursor-pointer"
                        onClick={() => setUsersPage((p) => Math.min(usersData.pagination.totalPages, p + 1))}
                        disabled={usersPage >= usersData.pagination.totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6B5744]">
                <Users className="h-8 w-8 mx-auto mb-2 text-[#A89880]" />
                <p className="font-serif font-semibold text-[#1A1008]">No users found</p>
              </div>
            )}
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms">
            {formsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="h-14 bg-[#FAF7F2] border border-[#D4C9B0] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : formsData && formsData.forms.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-[#D4C9B0] bg-[#FAF7F2] shadow-none">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#D4C9B0] bg-[#EDE8DC]">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Creator</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Theme</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">
                          <span className="flex items-center justify-center gap-1"><BarChart2 className="h-3.5 w-3.5" /> Resp.</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Created</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6B5744]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formsData.forms.map((form, idx) => (
                        <tr
                          key={form.id}
                          className={`border-b border-[#D4C9B0]/40 hover:bg-[#EDE8DC]/50 transition-colors ${idx % 2 === 0 ? "" : "bg-[#FAF7F2]"}`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-[#1A1008] line-clamp-1 block max-w-[200px]">{form.title}</span>
                          </td>
                          <td className="px-4 py-3 text-[#6B5744] text-xs">
                            <div>{form.creatorName}</div>
                            <div className="text-[#A89880]">{form.creatorEmail}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize px-1.5 ${
                                form.theme === "hogwarts"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : form.theme === "cyberpunk"
                                  ? "bg-yellow-600/10 text-yellow-700 border-yellow-600/20"
                                  : "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                              }`}
                            >
                              {form.theme}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[9px] capitalize px-1.5 ${
                                form.status === "published" && !form.isArchived
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : form.isArchived
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-neutral-100 text-neutral-500 border-neutral-200"
                              }`}
                            >
                              {form.isArchived ? "archived" : form.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-[#1A1008]">
                            {form.responseCount}
                          </td>
                          <td className="px-4 py-3 text-[#6B5744] text-xs">
                            {new Date(form.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-[#6B5744] hover:text-[#C41E3A] cursor-pointer"
                              disabled={deleteFormMutation.isPending}
                              title="Delete form"
                              onClick={() => {
                                if (confirm(`Delete form "${form.title}" by ${form.creatorName}? This is permanent.`)) {
                                  deleteFormMutation.mutate({ formId: form.id });
                                }
                              }}
                            >
                              {deleteFormMutation.isPending && deleteFormMutation.variables?.formId === form.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {formsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#6B5744]">
                      Page {formsPage} of {formsData.pagination.totalPages} ({formsData.pagination.total} forms)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 border-[#D4C9B0] text-[#6B5744] cursor-pointer"
                        onClick={() => setFormsPage((p) => Math.max(1, p - 1))}
                        disabled={formsPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 border-[#D4C9B0] text-[#6B5744] cursor-pointer"
                        onClick={() => setFormsPage((p) => Math.min(formsData.pagination.totalPages, p + 1))}
                        disabled={formsPage >= formsData.pagination.totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#6B5744]">
                <FileText className="h-8 w-8 mx-auto mb-2 text-[#A89880]" />
                <p className="font-serif font-semibold text-[#1A1008]">No forms found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
