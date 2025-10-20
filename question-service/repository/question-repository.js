import mongoose from "mongoose";
import questionModel from "../model/question-model.js";

export async function connectToDB() {
  await mongoose.connect("mongodb://mongo:27017/qdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

export async function findAnyWithDifficultyAndCategory(difficulty, categories) {
  const match = {};

  if (difficulty) {
    match.QuestionComplexity = difficulty;
  }

  if (categories && categories.length > 0) {
    match.QuestionCategories = { $in: categories };
  }

  const result = await questionModel.aggregate([
    { $match: match },
    { $sample: { size: 1 } },
  ]);

  return result[0] || null;
}

export async function findQuestionFromDbById(id) {
  return await questionModel.findOne({ _id: id });
}

export async function createQuestion(questionData) {
  const newQuestion = new questionModel(questionData);
  return await newQuestion.save();
}

export async function deleteQuestionById(id) {
  return await questionModel.deleteOne({ _id: id });
}

export async function updateQuestionById(id, updateData) {
  return await questionModel.updateOne({ _id: id }, { $set: updateData });
}
