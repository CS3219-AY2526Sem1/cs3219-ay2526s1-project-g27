import mongoose from "mongoose";

const Schema = mongoose.Schema;

const QuestionAttemptModelSchema = new Schema({
  Username: {
    type: String,
    required: true,
  },
  QuestionId: {
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
  IsCorrect: {
    type: Boolean,
    required: true,
  },
});

export default mongoose.model(
  "QuestionAttemptModel",
  QuestionAttemptModelSchema
);
