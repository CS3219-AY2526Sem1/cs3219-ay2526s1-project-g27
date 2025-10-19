import QuestionAttemptModel from "../model/question-attempt-model.js";

export async function findAttemptsByUser(username) {
  return await QuestionAttemptModel.find({ Username: username });
}

export async function addAttempt(attemptData) {
  const newAttempt = new QuestionAttemptModel(attemptData);
  return await newAttempt.save();
}
