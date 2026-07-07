import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Calendar API stub" });
});

export default router;
