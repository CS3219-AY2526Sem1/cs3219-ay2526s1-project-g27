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
  getAllAttempts,
  deleteAllAttempts,
} from "../controller/question-attempt-controller.js";

const router = express.Router();

// ✅ Specific routes first
router.post("/random", getRandomQuestion);
router.get("/all", getAllQuestions);
router.get("/attempt/:UserId", findUserAttempts);
router.post("/attempt", addUserAttempt);
router.get("/attempt/all", getAllAttempts);
router.delete("/attempt/all", deleteAllAttempts);

// ✅ Dynamic routes last
router.post("/", createNewQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);
router.get("/:id", findQuestionById);

export default router;
