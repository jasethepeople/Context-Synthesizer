import { Router, type IRouter } from "express";
import healthRouter from "./health";
import webhooksRouter from "./webhooks";
import ingestionRouter from "./ingestion";
import sessionRouter from "./session";
import deltaRouter from "./delta";
import graphRouter from "./graph";
import sseRouter from "./sse";

const router: IRouter = Router();

router.use(healthRouter);
router.use(webhooksRouter);
router.use(ingestionRouter);
router.use(sessionRouter);
router.use(deltaRouter);
router.use(graphRouter);
router.use(sseRouter);

export default router;
