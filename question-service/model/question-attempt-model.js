import mongoose from "mongoose";

const Schema = mongoose.Schema;

const QuestionAttemptModelSchema = new Schema({
  UserId: {
    type: String,
    required: true,
  },
  QuestionTitle: {
    type: String,
    required: true,
  },
  AttemptedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  Categories: {
    type: [String],
    required: true,
  },
  Difficulty: {
    type: String,
    required: true,
  }
});

export default mongoose.model(
  "QuestionAttemptModel",
  QuestionAttemptModelSchema
);
