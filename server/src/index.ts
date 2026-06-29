import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { checkFeatureAccess } from "./middleware/featureAccess";
import { allowedOrigins, env } from "./config/env";
import { prisma } from "./lib/prisma";

// Routes
import loginRoutes from "./routes/auth/login";
import resolveLoginRoutes from "./routes/auth/resolve-login";
import sessionRoutes from "./routes/auth/session";
import meRoutes from "./routes/auth/me";
import inviteRoutes from "./routes/orgs/invites/create";
import createFloorRoutes from "./routes/floors/create";
import listFloorRoutes from "./routes/floors/list";
import createRoomRoutes from "./routes/rooms/create";
import listRoomRoutes from "./routes/rooms/list";
import roomDetailsRoutes from "./routes/rooms/details";
import assignRoomTenantRoutes from "./routes/rooms/assign";
import removeRoomTenantRoutes from "./routes/rooms/remove";
import listMembersRoutes from "./routes/orgs/members/list";
import listTenantsRoutes from "./routes/tenants/list";
import createTenantRoutes from "./routes/tenants/create";
import vacateTenantRoutes from "./routes/tenants/vacate";
import requestPassRoutes from "./routes/gate-passes/request";
import approvePassRoutes from "./routes/gate-passes/approve";
import checkoutPassRoutes from "./routes/gate-passes/checkout";
import checkinPassRoutes from "./routes/gate-passes/checkin";
import listPassRoutes from "./routes/gate-passes/list";
import cancelPassRoutes from "./routes/gate-passes/cancel";
import createDueRoutes from "./routes/dues/create";
import listDueRoutes from "./routes/dues/list";
import recordPaymentRoutes from "./routes/payments/create";
import listPaymentRoutes from "./routes/payments/list";
import createComplaintRoutes from "./routes/complaints/create";
import assignComplaintRoutes from "./routes/complaints/assign";
import statusComplaintRoutes from "./routes/complaints/status";
import listComplaintRoutes from "./routes/complaints/list";
import createAnnouncementRoutes from "./routes/announcements/create";
import listAnnouncementRoutes from "./routes/announcements/list";
import readAnnouncementRoutes from "./routes/announcements/read";
import communityInteractionRoutes from "./routes/community/interactions";
import lostFoundRoutes from "./routes/community/lost-found";
import createVisitorRoutes from "./routes/visitors/create";
import approveVisitorRoutes from "./routes/visitors/approve";
import checkinVisitorRoutes from "./routes/visitors/checkin";
import checkoutVisitorRoutes from "./routes/visitors/checkout";
import listVisitorRoutes from "./routes/visitors/list";
import createMessMenuRoutes from "./routes/mess-menus/create";
import publishMessMenuRoutes from "./routes/mess-menus/publish";
import getMessMenuRoutes from "./routes/mess-menus/get";
import createMessFeedbackRoutes from "./routes/mess-feedback/create";
import summaryMessFeedbackRoutes from "./routes/mess-feedback/summary";
import createStaffContactRoutes from "./routes/staff-contacts/create";
import listStaffContactRoutes from "./routes/staff-contacts/list";
import updateStaffContactRoutes from "./routes/staff-contacts/update";
import createDocumentRoutes from "./routes/documents/create";
import listDocumentRoutes from "./routes/documents/list";
import verifyDocumentRoutes from "./routes/documents/verify";
import listNotificationRoutes from "./routes/notifications/list";
import readNotificationRoutes from "./routes/notifications/read";
import getDueReminderConfigRoutes from "./routes/dues/reminder-config/get";
import updateDueReminderConfigRoutes from "./routes/dues/reminder-config/update";
import linkParentRoutes from "./routes/parents/link";
import updateParentPrivacyRoutes from "./routes/parents/privacy";
import getWardDetailsRoutes from "./routes/parents/ward";
import listAuditLogsRoutes from "./routes/audit-logs/list";
import roomHistoryRoutes from "./routes/rooms/history";
import getMetricsRoutes from "./routes/metrics/get";
import platformAuthRoutes from "./routes/platform/auth/login";
import createPlanRoutes from "./routes/platform/plans/create";
import listPlanRoutes from "./routes/platform/plans/list";
import listOrgRoutes from "./routes/platform/organizations/list";
import updateOrgRoutes from "./routes/platform/organizations/update";
import featuresOrgRoutes from "./routes/platform/organizations/features";
import accountOrgRoutes from "./routes/platform/organizations/accounts";






export const app = express();
const logger = pino({ level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.body.password", "req.body.refreshToken"] });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many login attempts. Try again later." } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false });

// Middlewares
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error("Origin is not allowed by CORS")); }, credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/platform/auth", authLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date() });
});
app.get("/ready", async (req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; return res.status(200).json({ status: "ready", time: new Date() }); }
  catch { return res.status(503).json({ status: "not_ready" }); }
});

app.use("/api/rooms", checkFeatureAccess("rooms"));
app.use("/api/dues", checkFeatureAccess("dues"));
app.use("/api/payments", checkFeatureAccess("dues"));
app.use("/api/gate-passes", checkFeatureAccess("gate_pass"));
app.use("/api/visitors", checkFeatureAccess("visitor_log"));
app.use("/api/announcements", checkFeatureAccess("community"));
app.use("/api/complaints", checkFeatureAccess("community"));
app.use("/api/community", checkFeatureAccess("community"));
app.use("/api/mess-menus", checkFeatureAccess("mess_menu"));
app.use("/api/mess-feedback", checkFeatureAccess("mess_menu"));
app.use("/api/documents", checkFeatureAccess("documents"));

// Register API Routes
app.use("/api/auth/login", loginRoutes);
app.use("/api/auth/resolve-login", resolveLoginRoutes);
app.use("/api/auth", sessionRoutes);
app.use("/api/auth/me", meRoutes);
app.use("/api/orgs/invites", inviteRoutes);
app.use("/api/orgs/:orgId", listMembersRoutes);
app.use("/api/floors", createFloorRoutes);
app.use("/api/floors", listFloorRoutes);
app.use("/api/rooms", createRoomRoutes);
app.use("/api/rooms", listRoomRoutes);
app.use("/api/rooms", assignRoomTenantRoutes);
app.use("/api/rooms", removeRoomTenantRoutes);
app.use("/api/rooms", roomDetailsRoutes);
app.use("/api/tenants", listTenantsRoutes);
app.use("/api/tenants", createTenantRoutes);
app.use("/api/tenants", vacateTenantRoutes);
app.use("/api/gate-passes", requestPassRoutes);
app.use("/api/gate-passes", approvePassRoutes);
app.use("/api/gate-passes", checkoutPassRoutes);
app.use("/api/gate-passes", checkinPassRoutes);
app.use("/api/gate-passes", listPassRoutes);
app.use("/api/gate-passes", cancelPassRoutes);
app.use("/api/dues", createDueRoutes);
app.use("/api/dues", listDueRoutes);
app.use("/api/payments", recordPaymentRoutes);
app.use("/api/payments", listPaymentRoutes);
app.use("/api/complaints", createComplaintRoutes);
app.use("/api/complaints", assignComplaintRoutes);
app.use("/api/complaints", statusComplaintRoutes);
app.use("/api/complaints", listComplaintRoutes);
app.use("/api/announcements", createAnnouncementRoutes);
app.use("/api/announcements", listAnnouncementRoutes);
app.use("/api/announcements", readAnnouncementRoutes);
app.use("/api/community/interactions", communityInteractionRoutes);
app.use("/api/community/lost-found", lostFoundRoutes);
app.use("/api/visitors", createVisitorRoutes);
app.use("/api/visitors", approveVisitorRoutes);
app.use("/api/visitors", checkinVisitorRoutes);
app.use("/api/visitors", checkoutVisitorRoutes);
app.use("/api/visitors", listVisitorRoutes);
app.use("/api/mess-menus", createMessMenuRoutes);
app.use("/api/mess-menus", publishMessMenuRoutes);
app.use("/api/mess-menus", getMessMenuRoutes);
app.use("/api/mess-feedback", createMessFeedbackRoutes);
app.use("/api/mess-feedback", summaryMessFeedbackRoutes);
app.use("/api/staff-contacts", createStaffContactRoutes);
app.use("/api/staff-contacts", listStaffContactRoutes);
app.use("/api/staff-contacts", updateStaffContactRoutes);
app.use("/api/documents", createDocumentRoutes);
app.use("/api/documents", listDocumentRoutes);
app.use("/api/documents", verifyDocumentRoutes);
app.use("/api/notifications", listNotificationRoutes);
app.use("/api/notifications", readNotificationRoutes);
app.use("/api/dues", getDueReminderConfigRoutes);
app.use("/api/dues", updateDueReminderConfigRoutes);
app.use("/api/parents", linkParentRoutes);
app.use("/api/parents", updateParentPrivacyRoutes);
app.use("/api/parents", getWardDetailsRoutes);
app.use("/api/audit-logs", listAuditLogsRoutes);
app.use("/api/rooms", roomHistoryRoutes);
app.use("/api/metrics", getMetricsRoutes);
app.use("/api/platform/auth", platformAuthRoutes);
app.use("/api/platform/plans", createPlanRoutes);
app.use("/api/platform/plans", listPlanRoutes);
app.use("/api/platform/organizations", listOrgRoutes);
app.use("/api/platform/organizations", updateOrgRoutes);
app.use("/api/platform/organizations", featuresOrgRoutes);
app.use("/api/platform/organizations", accountOrgRoutes);






// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log?.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Something went wrong on the server" });
});

// Start Server
// Vercel imports the Express application as a function. Local, Docker, and
// traditional Node deployments still use the port listener.
export default app;

if (env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(env.PORT, () => logger.info({ port: env.PORT }, "HostIn API started"));
}
