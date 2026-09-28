import type { MessRole } from "@/types/mess";
import type { MonthStatus } from "@/types/month";

export interface PermissionContext {
  authUid?: string | null;
  userMessId?: string | null;
  targetMessId: string;
  role?: MessRole | null;
  monthStatus?: MonthStatus;
  allowMemberMealEntry?: boolean;
  targetUserId?: string;
}

/**
 * Pure permission evaluation functions mirroring `firestore.rules` and `storage.rules`.
 * Used both in UI/service guards and in automated security tests.
 */
export function isAuthenticated(uid?: string | null): boolean {
  return Boolean(uid && uid.trim().length > 0);
}

export function isMember(ctx: PermissionContext): boolean {
  return (
    isAuthenticated(ctx.authUid) &&
    Boolean(ctx.userMessId) &&
    ctx.userMessId === ctx.targetMessId &&
    Boolean(ctx.role)
  );
}

export function isOwner(ctx: PermissionContext): boolean {
  return isMember(ctx) && ctx.role === "owner";
}

export function isAdmin(ctx: PermissionContext): boolean {
  return isMember(ctx) && ctx.role === "admin";
}

export function canManage(ctx: PermissionContext): boolean {
  return isMember(ctx) && (ctx.role === "owner" || ctx.role === "admin");
}

export function canModifyMonthData(ctx: PermissionContext): boolean {
  if (!isMember(ctx)) return false;
  if (ctx.monthStatus === "closed") return false;
  return canManage(ctx);
}

export function canRecordMeal(ctx: PermissionContext): boolean {
  if (!isMember(ctx)) return false;
  if (ctx.monthStatus === "closed") return false;
  if (canManage(ctx)) return true;
  if (
    ctx.role === "member" &&
    ctx.allowMemberMealEntry &&
    ctx.targetUserId &&
    ctx.targetUserId === ctx.authUid
  ) {
    return true;
  }
  return false;
}

export function canRemoveMember(
  ctx: PermissionContext,
  targetMemberRole: MessRole
): boolean {
  if (!isOwner(ctx)) return false;
  // Owner cannot remove themselves / another owner
  if (targetMemberRole === "owner") return false;
  return true;
}

export function canChangeRole(ctx: PermissionContext): boolean {
  return isOwner(ctx);
}

export function canCloseOrReopenMonth(ctx: PermissionContext): boolean {
  return canManage(ctx);
}
