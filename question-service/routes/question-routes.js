import express from "express";

import {
  getRandomQuestion,
  createNewQuestion,
  deleteQuestion,
  updateQuestion,
  findQuestionById,
  getAllQuestions,
} from "../controller/question-controller.js";

import {
  findUserAttempts,
  addUserAttempt,
} from "../controller/question-attempt-controller.js";

const router = express.Router();

router.get("/random", getRandomQuestion);

router.get("/all", getAllQuestions);

router.post("/", createNewQuestion);

router.delete("/:id", deleteQuestion);

router.put("/:id", updateQuestion);

router.get("/:id", findQuestionById);

router.get("/attempt/:username", findUserAttempts);

router.post("/attempt", addUserAttempt);

export default router;
