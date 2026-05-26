import { db, eq, and, desc, count, sql } from "@repo/database";
import {
  usersTable,
  formsTable,
  responsesTable,
} from "@repo/database/schema";
import { TRPCError } from "@trpc/server";

export class AdminService {
  /** Overall platform statistics */
  public async getSystemStats() {
    const [usersRes, formsRes, responsesRes, completedRes] = await Promise.all([
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(formsTable),
      db.select({ count: count() }).from(responsesTable),
      db
        .select({ count: count() })
        .from(responsesTable)
        .where(eq(responsesTable.completed, true)),
    ]);

    return {
      totalUsers: usersRes[0]?.count ?? 0,
      totalForms: formsRes[0]?.count ?? 0,
      totalResponses: responsesRes[0]?.count ?? 0,
      completedResponses: completedRes[0]?.count ?? 0,
    };
  }

  /** Paginated list of all users with their form count */
  public async getAllUsers(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [totalRes, users] = await Promise.all([
      db.select({ count: count() }).from(usersTable),
      db
        .select({
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
          isAdmin: usersTable.isAdmin,
          createdAt: usersTable.createdAt,
          formCount: sql<number>`(SELECT COUNT(*) FROM forms WHERE forms.creator_id = users.id)`,
        })
        .from(usersTable)
        .orderBy(desc(usersTable.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return {
      users,
      pagination: {
        total: totalRes[0]?.count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((totalRes[0]?.count ?? 0) / limit),
      },
    };
  }

  /** Paginated list of all forms with creator name and response count */
  public async getAllForms(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [totalRes, forms] = await Promise.all([
      db.select({ count: count() }).from(formsTable),
      db
        .select({
          id: formsTable.id,
          title: formsTable.title,
          theme: formsTable.theme,
          status: formsTable.status,
          visibility: formsTable.visibility,
          isArchived: formsTable.isArchived,
          createdAt: formsTable.createdAt,
          creatorName: usersTable.fullName,
          creatorEmail: usersTable.email,
          responseCount: sql<number>`(SELECT COUNT(*) FROM responses WHERE responses.form_id = forms.id AND responses.completed = true)`,
        })
        .from(formsTable)
        .innerJoin(usersTable, eq(formsTable.creatorId, usersTable.id))
        .orderBy(desc(formsTable.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    return {
      forms,
      pagination: {
        total: totalRes[0]?.count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((totalRes[0]?.count ?? 0) / limit),
      },
    };
  }

  /** Delete a user by admin — cannot self-delete */
  public async deleteUser(adminId: string, targetUserId: string) {
    if (adminId === targetUserId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Admins cannot delete their own account.",
      });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, targetUserId),
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    }

    await db.delete(usersTable).where(eq(usersTable.id, targetUserId));
    return { success: true };
  }

  /** Delete a form as admin */
  public async deleteForm(formId: string) {
    const form = await db.query.formsTable.findFirst({
      where: eq(formsTable.id, formId),
    });

    if (!form) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
    }

    await db.delete(formsTable).where(eq(formsTable.id, formId));
    return { success: true };
  }
}

export const adminService = new AdminService();
export default AdminService;
