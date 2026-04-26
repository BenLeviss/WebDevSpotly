import { Router } from "express";
import { reindexPlaceEmbeddings, semanticSearch } from "../controllers/aiSearch";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/semantic-search", authenticate, semanticSearch);
router.post("/reindex-place-embeddings", authenticate, reindexPlaceEmbeddings);

export default router;
