import { Router } from "express";
import { parseQuery, reindexPlaceEmbeddings, semanticSearch } from "../controllers/aiSearch";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * POST /ai/parse-query
 * Body: { query: string }
 * Returns: ParsedQuery (normalizedQuery, filters, confidence, warnings)
 */
router.post("/parse-query", authenticate, parseQuery);
router.post("/semantic-search", authenticate, semanticSearch);
router.post("/reindex-place-embeddings", authenticate, reindexPlaceEmbeddings);

export default router;
