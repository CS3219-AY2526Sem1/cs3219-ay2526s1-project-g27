import QuestionAttemptModel from "../model/question-attempt-model.js";

export async function findAttemptsByUser(UserId) {
  console.log("Finding attempts for UserId:", UserId);
  return await QuestionAttemptModel.find({ UserId: UserId });
}

export async function addAttempt(attemptData) {
  const newAttempt = new QuestionAttemptModel(attemptData);
  return await newAttempt.save();
}
