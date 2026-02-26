import express from "express";
import { getAllUsers, addNewUser, updateUser, getUser, deleteUser } from "../controller/controlUsers.js";
import { getUserStats, getCounselorStats, getAdminStats } from "../controller/controlStats.js";
import { controlUserLogin } from "../controller/controlLogin.js";
import { servePasswordResetForm, resetPasswordLink, resetPassword } from "../controller/controlPasswordReset.js";
import { getAllCounselors, addNewCounselor, updateCounselor, getCounselor, deleteCounselor } from "../controller/controlCounselors.js";
import { controlCounselorLogin } from "../controller/controlLogin.js";
import { getAllAdmins, addNewAdmin, updateAdmin, getAdmin, deleteAdmin } from "../controller/controlAdmins.js";
import { controlAdminLogin } from "../controller/controlLogin.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";
import { verifyRoles } from "../middlewares/verifyRoles.js";
import { ROLE_LIST } from "../config/role_list.js";
import { createSession, getSessions, deleteSession, autoAssignCounselorController, activateSession, endSession } from "../controller/controlSessions.js";
import { getNotifications, deleteNotification } from "../controller/controlNotification.js";
import { sendMessage, getMessages, deleteMessage } from "../controller/controlMessages.js";
import { createCheckin, getMyCheckins, getUserCheckins } from "../controller/controlCheckins.js";

import { testAIConfig, askAI } from "../controller/controlAi.js";
import { createFeedback, getAllFeedbacks, getFeedbackById, deleteFeedback } from "../controller/controlFeedback.js";
import { handleRefreshToken } from "../controller/controlRefreshToken.js";
import { handleLogout } from "../controller/controlLogout.js";
const router = express.Router();
//unprotected routes

router.post("/users", addNewUser); //adding new user
router.post("/admins", addNewAdmin); //adding new admin

//login routes
router.post("/auth/login/user", controlUserLogin);
router.post("/auth/login/counselor", controlCounselorLogin);
router.post("/auth/login/admin", controlAdminLogin);


//password reset routes for users
router.get("/auth/user/password-reset/serve-password-reset-form", servePasswordResetForm);
router.post("/auth/user/password-reset/password-reset-form", resetPasswordLink);
router.post("/auth/password-reset/reset-password", resetPassword);
router.get("/auth/refresh", handleRefreshToken);
router.get("/auth/logout", handleLogout);


//protected routes
router.use(verifyJwt);
//control user routes
router.get("/users", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), getAllUsers);
router.put("/users/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor, ROLE_LIST.user), updateUser);
router.get("/users/:id", verifyRoles(ROLE_LIST.user), getUser);
router.delete("/users/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.user), deleteUser);

//counselor routes
router.get("/counselors", verifyRoles(ROLE_LIST.admin), getAllCounselors);
router.post("/counselors", verifyRoles(ROLE_LIST.admin),addNewCounselor); //adding new counselor
router.put("/counselors/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), updateCounselor);
router.get("/counselors/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), getCounselor);
router.delete("/counselors/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), deleteCounselor);

//admin routes
router.get("/admins", verifyRoles(ROLE_LIST.admin), getAllAdmins);
router.put("/admins/:id", verifyRoles(ROLE_LIST.admin), updateAdmin);
router.get("/admins/:id", verifyRoles(ROLE_LIST.admin), getAdmin);
router.delete("/admins/:id", verifyRoles(ROLE_LIST.admin), deleteAdmin);

//session routes
router.post("/sessions", verifyRoles(ROLE_LIST.user), createSession);
router.post("/sessions/auto-assign/:session_id", verifyRoles(ROLE_LIST.admin), autoAssignCounselorController);
router.post("/sessions/:session_id/activate", verifyRoles(ROLE_LIST.counselor, ROLE_LIST.admin), activateSession);
router.post("/sessions/:session_id/end", verifyRoles(ROLE_LIST.counselor, ROLE_LIST.admin), endSession);
router.get("/sessions", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor, ROLE_LIST.user), getSessions);
router.delete("/sessions/:session_id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor, ROLE_LIST.user), deleteSession);


//notification routes
router.get("/notifications", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor, ROLE_LIST.user), getNotifications);
router.delete("/notifications/:notification_id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor, ROLE_LIST.user), deleteNotification);

//message routes
router.post("/sessions/:session_id/messages", verifyRoles(ROLE_LIST.user, ROLE_LIST.counselor), sendMessage);
router.get("/sessions/:session_id/messages", verifyRoles(ROLE_LIST.user, ROLE_LIST.counselor), getMessages);
router.delete("/messages/:message_id", verifyRoles(ROLE_LIST.user, ROLE_LIST.counselor), deleteMessage);

//check-in routes
router.post("/checkins", verifyRoles(ROLE_LIST.user), createCheckin);
router.get("/checkins", verifyRoles(ROLE_LIST.user), getMyCheckins);
router.get("/checkins/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), getUserCheckins);

//ai routes
router.get("/ai/test", testAIConfig);
router.post("/ai/chat", verifyRoles(ROLE_LIST.user, ROLE_LIST.counselor), askAI);

//feedback routes
router.post("/feedback", verifyRoles(ROLE_LIST.user), createFeedback);
router.get("/feedback", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), getAllFeedbacks);
router.get("/feedback/:id", verifyRoles(ROLE_LIST.admin, ROLE_LIST.counselor), getFeedbackById);
router.delete("/feedback/:id", verifyRoles(ROLE_LIST.admin), deleteFeedback);

// stats routes
router.get("/stats/user", verifyRoles(ROLE_LIST.user), getUserStats);
router.get("/stats/counselor", verifyRoles(ROLE_LIST.counselor), getCounselorStats);
router.get("/stats/admin", verifyRoles(ROLE_LIST.admin), getAdminStats);

export default router;