import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pharmacyRouter from "./pharmacy";
import authRouter, { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth, pharmacyRouter);

export default router;
