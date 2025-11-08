import {
  findAttemptsByUser,
  addAttempt,
} from "../repository/question-attempt-repo.js";
import QuestionAttemptModel from "../model/question-attempt-model.js";

export async function findUserAttempts(req, res) {
  try {
    console.log("Request params:", req.params);
    const UserId = req.params.UserId;
    const attempts = await findAttemptsByUser(UserId);
    return res.status(200).json(attempts);
  } catch (error) {
    console.error("Error finding user attempts:", error);
    return res.status(500).json({ message: "Error finding user attempts" });
  }
}

export async function addUserAttempt(req, res) {
  try {
    const { UserId1, UserId2, question } = req.body;
    const QuestionTitle = question.QuestionTitle;
    const Categories = question.QuestionCategories;
    const Difficulty = question.QuestionComplexity;
    await addAttempt({ UserId: UserId1, QuestionTitle, Categories, Difficulty });
    await addAttempt({ UserId: UserId2, QuestionTitle, Categories, Difficulty });
    return res.status(200).json({ message: "User attempts added successfully" });
  } catch (error) {
    console.error("Error adding user attempt:", error);
    return res.status(500).json({ message: "Error adding user attempt" });
  }
}


export async function getAllAttempts(req, res) {
  try {
    const attempts = await QuestionAttemptModel.find({});
    return res.status(200).json(attempts);
  } catch (error) {
    console.error("Error retrieving all attempts:", error);
    return res.status(500).json({ message: "Error retrieving all attempts" });
  }
}

export async function deleteAllAttempts(req, res) {
  try {
    await QuestionAttemptModel.deleteMany({});
    return res.status(200).json({ message: "All attempts deleted successfully" });
  } catch (error) {
    console.error("Error deleting all attempts:", error);
    return res.status(500).json({ message: "Error deleting all attempts" });
  }
}