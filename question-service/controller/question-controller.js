import {
  findAnyWithDifficultyAndCategory,
  createQuestion,
  deleteQuestionById,
  updateQuestionById,
  findQuestionFromDbById,
} from "../repository/question-repository.js";
import questionModel from "../model/question-model.js";

export async function getRandomQuestion(req, res) {
  const { difficulty, categories } = req.body;
  try {
    const question = await findAnyWithDifficultyAndCategory(
      difficulty,
      categories
    );

    if (!question) {
      return res.status(404).json({ message: "No question found" });
    }

    let questionScore = 0;
    switch (question.QuestionComplexity) {
      case "easy":
        questionScore = 1;
        break;
      case "medium":
        questionScore = 5;
        break;
      case "hard":
        questionScore = 10;
        break;
      default:
        questionScore = 0;
    }

    const questionWithScore = {
      ...(question.toObject?.() ?? question),
      questionScore,
    };

    return res.json(questionWithScore);
  } catch (error) {
    console.error("Error fetching random question:", error);
    return res.status(500).json({ message: "Error fetching random question" });
  }
}

export async function createNewQuestion(req, res) {
  // req body must contain :
  //   {
  //     "QuestionTitle": "test q",
  //     "QuestionDescription": "test q desc",
  //     "QuestionComplexity" : "easy",
  //     "QuestionCategories" : ["TESTCAT"]
  // }
  try {
    const createdQuestion = await createQuestion(req.body);
    console.log("Created question:", createdQuestion);
    return res
      .status(201)
      .json({ message: "Question created successfully", createdQuestion });
  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({ message: "Error creating question" });
  }
}

export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    await deleteQuestionById(id);
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({ message: "Error deleting question" });
  }
}

export async function updateQuestion(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await updateQuestionById(id, updateData);
    return res.status(200).json({ message: "Question updated successfully" });
  } catch (error) {
    console.error("Error updating question:", error);
    return res.status(500).json({ message: "Error updating question" });
  }
}

export async function findQuestionById(req, res) {
  try {
    const { id } = req.params;
    const question = await findQuestionFromDbById(id);
    return res.json(question);
  } catch (error) {
    console.error("Error fetching question by ID:", error);
    return res.status(500).json({ message: "Error fetching question by ID" });
  }
}

export async function getAllQuestions(req, res) {
  try {
    const questions = await questionModel.find({});
    return res.json(questions);
  } catch (error) {
    console.error("Error fetching all questions:", error);
    return res.status(500).json({ message: "Error fetching all questions" });
  }
}
