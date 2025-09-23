import express from "express";

import { getRandomQuestion } from "../controller/question-controller.js";

const router = express.Router();

router.get("/random", getRandomQuestion);

export default router;
