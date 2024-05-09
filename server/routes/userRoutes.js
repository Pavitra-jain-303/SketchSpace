import { Router } from "express";
const router = Router();

import { authUser, registerUser, allUsers } from "../controller/userController.js";
import { protect } from "../middleware/authMiddleware.js";


router.route("/").get(protect, allUsers);
router.route("/register").post(registerUser);
router.post("/login", authUser);

export default router;