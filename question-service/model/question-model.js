import mongoose from "mongoose";

const Schema = mongoose.Schema;

const QuestionModelSchema = new Schema({
  questionId: {
    type: Number,
    required: true,
    unique: true,
  },
  QuestionTitle: {
    type: String,
    required: true,
    unique: true,
  },
  QuestionDescription: {
    type: String,
    required: true,
  },
  QuestionCategories: {
    type: [String],
  },
  QuestionComplexity: {
    type: String,
    enum: ["easy", "medium", "hard"],
  },
});

export default mongoose.model("QuestionModel", QuestionModelSchema);
