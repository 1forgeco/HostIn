import { Response } from "express";
import { AuthorizedRequest } from "../../../middleware/orgAccess";
import { prisma } from "../../../lib/prisma";
import { notifyAllMembers } from "../../../lib/notifications";

export const handleListLostFound = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const posts = await prisma.lostFoundPost.findMany({ where: { org_id: orgId }, include: { author: { select: { full_name: true } } }, orderBy: { created_at: "desc" } });
  const interactions = await prisma.communityInteraction.findMany({ where: { org_id: orgId, post_type: "lost", post_id: { in: posts.map((post) => post.id) } }, include: { user: { select: { full_name: true } } }, orderBy: { created_at: "asc" } });
  return res.json({ posts: posts.map((post) => ({ id: post.id, body: post.caption, imageUrls: post.image_urls, publisherName: post.author.full_name, createdAt: post.created_at, reactionCount: interactions.filter((item) => item.post_id === post.id && item.kind === "reaction").length, commentCount: interactions.filter((item) => item.post_id === post.id && item.kind === "comment").length, comments: interactions.filter((item) => item.post_id === post.id && item.kind === "comment").map((item) => ({ id: item.id, body: item.body, authorName: item.user.full_name })) })) });
};

export const handleCreateLostFound = async (req: AuthorizedRequest, res: Response) => {
  const orgId = req.headers["x-org-id"] as string;
  const { caption, imageUrls = [] } = req.body;
  if (!String(caption ?? "").trim()) return res.status(400).json({ error: "Caption is required" });
  if (!Array.isArray(imageUrls) || imageUrls.length > 4) return res.status(400).json({ error: "Up to four images are allowed" });
  if (imageUrls.some((image) => typeof image !== "string" || image.length > 2_500_000 || !image.startsWith("data:image/"))) return res.status(400).json({ error: "Images must be valid and under 2 MB each" });
  const post = await prisma.lostFoundPost.create({ data: { org_id: orgId, author_id: req.user?.userId as string, caption: String(caption).trim(), image_urls: imageUrls } });
  await notifyAllMembers(prisma, { orgId, title: "New lost & found post", body: String(caption).trim(), type: "other", referenceId: post.id, referenceType: "lost" }, req.user?.userId);
  return res.status(201).json({ post });
};
