import { Router } from "express";
import { parseQuery } from "../controllers/aiSearch";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * POST /ai/parse-query
 * Body: { query: string }
 * Returns: ParsedQuery (normalizedQuery, filters, confidence, warnings)
 */
router.post("/parse-query", authenticate, parseQuery);

export default router;
