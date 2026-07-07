import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Analytics API stub" });
});

export default router;
