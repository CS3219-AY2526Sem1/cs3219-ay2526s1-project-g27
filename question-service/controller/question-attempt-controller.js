import {
  findAttemptsByUser,
  addAttempt,
} from "../repository/question-attempt-repo.js";

export async function findUserAttempts(req, res) {
  try {
    const { username } = req.params;
    const attempts = await findAttemptsByUser(username);
    return res.status(200).json(attempts);
  } catch (error) {
    console.error("Error finding user attempts:", error);
    return res.status(500).json({ message: "Error finding user attempts" });
  }
}

export async function addUserAttempt(req, res) {
  try {
    const attemptData = req.body;
    const attempts = await addAttempt(attemptData);
    return res.status(200).json(attempts);
  } catch (error) {
    console.error("Error adding user attempt:", error);
    return res.status(500).json({ message: "Error adding user attempt" });
  }
}
