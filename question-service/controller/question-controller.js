import { findAnyWithDifficultyAndCategory } from "../repository/question-repository.js";

export async function getRandomQuestion(req, res) {
  const { difficulty, categories } = req.body;
  const question = await findAnyWithDifficultyAndCategory(
    difficulty,
    categories
  );

  return res.json(question);
}
