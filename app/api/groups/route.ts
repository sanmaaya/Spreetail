// app/api/groups/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { groups, groupMemberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

/**
 * GET – list all groups the current user belongs to, or fetch details of a specific group (with members).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);

  const url = new URL(req.url);
  const groupIdParam = url.searchParams.get("groupId");

  if (groupIdParam) {
    const groupId = Number(groupIdParam);
    // Check if user is a member of this group
    const membership = await db
      .select()
      .from(groupMemberships)
      .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, userId)))
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Unauthorized group access" }, { status: 403 });
    }

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // Get all members of the group
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        joinDate: groupMemberships.joinDate,
        leaveDate: groupMemberships.leaveDate,
      })
      .from(users)
      .innerJoin(groupMemberships, eq(users.id, groupMemberships.userId))
      .where(eq(groupMemberships.groupId, groupId));

    return NextResponse.json({ ...group, members });
  }

  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .innerJoin(groupMemberships, eq(groups.id, groupMemberships.groupId))
    .where(eq(groupMemberships.userId, userId));

  return NextResponse.json(userGroups);
}

/**
 * POST – create a new group. Body: { name: string }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  
  const [newGroup] = await db
    .insert(groups)
    .values({ name })
    .returning({ id: groups.id, name: groups.name, createdAt: groups.createdAt });
    
  // Add creator as first member with joinDate = now
  await db
    .insert(groupMemberships)
    .values({ groupId: newGroup.id, userId: userId, joinDate: new Date() });
    
  return NextResponse.json(newGroup, { status: 201 });
}

/**
 * PUT – update group name or membership. Body can contain:
 *   { groupId, name? , addMembers?: [{userId, joinDate}], removeMembers?: [{userId, leaveDate}] }
 */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { groupId, name, addMembers, removeMembers } = await req.json();
  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });
  
  // Optional name change
  if (name) {
    await db.update(groups).set({ name }).where(eq(groups.id, groupId));
  }
  
  // Add new members
  if (Array.isArray(addMembers)) {
    for (const m of addMembers) {
      // Check if user is already a member
      const existing = await db
        .select()
        .from(groupMemberships)
        .where(and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, m.userId)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(groupMemberships).values({
          groupId,
          userId: m.userId,
          joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
        });
      } else {
        // If they had left and are rejoining or updating dates
        await db
          .update(groupMemberships)
          .set({
            joinDate: m.joinDate ? new Date(m.joinDate) : existing[0].joinDate,
            leaveDate: m.leaveDate ? new Date(m.leaveDate) : null,
          })
          .where(eq(groupMemberships.id, existing[0].id));
      }
    }
  }
  
  // Mark members as left
  if (Array.isArray(removeMembers)) {
    for (const m of removeMembers) {
      await db
        .update(groupMemberships)
        .set({ leaveDate: m.leaveDate ? new Date(m.leaveDate) : new Date() })
        .where(
          and(eq(groupMemberships.groupId, groupId), eq(groupMemberships.userId, m.userId))
        );
    }
  }
  return NextResponse.json({ success: true });
}

/**
 * DELETE – delete a group.
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { groupId } = await req.json();
  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });
  
  // Delete memberships and related expenses first
  await db.delete(groupMemberships).where(eq(groupMemberships.groupId, groupId));
  await db.delete(groups).where(eq(groups.id, groupId));
  return NextResponse.json({ success: true });
}
