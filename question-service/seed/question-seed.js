/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025-9-23
Scope: 
- translate natural language instructions into code
Author review: 
- I validated correctness, and tested it manually by checking if the database is seeded correctly when empty.
*/


import questionModel from "../model/question-model.js";

export async function seedTestQuestions() {
  const count = await questionModel.countDocuments();
  if (count > 0) return;

  console.log("DB is empty. Seeding test questions...");

  const questions = [
    {
      questionId: 1,
      QuestionTitle: "Reverse a String",
      QuestionDescription: `Write a function that reverses a string. Input is given as an array of characters s. Must do this in-place with O(1) extra memory.`,
      QuestionCategories: ["Strings", "Algorithms"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 2,
      QuestionTitle: "Linked List Cycle Detection",
      QuestionDescription:
        "Implement a function to detect if a linked list contains a cycle.",
      QuestionCategories: ["Data Structures", "Algorithms"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 3,
      QuestionTitle: "Roman to Integer",
      QuestionDescription: "Given a roman numeral, convert it to an integer.",
      QuestionCategories: ["Algorithms"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 4,
      QuestionTitle: "Add Binary",
      QuestionDescription:
        "Given two binary strings a and b, return their sum as a binary string.",
      QuestionCategories: ["Bit Manipulation", "Algorithms"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 5,
      QuestionTitle: "Fibonacci Number",
      QuestionDescription: "Given n, calculate the Fibonacci number F(n).",
      QuestionCategories: ["Recursion", "Algorithms"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 6,
      QuestionTitle: "Implement Stack using Queues",
      QuestionDescription: "Implement a LIFO stack using only two queues.",
      QuestionCategories: ["Data Structures"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 7,
      QuestionTitle: "Combine Two Tables",
      QuestionDescription: "SQL problem: Combine Person and Address tables.",
      QuestionCategories: ["Databases"],
      QuestionComplexity: "easy",
    },
    {
      questionId: 8,
      QuestionTitle: "Repeated DNA Sequences",
      QuestionDescription:
        "Find all 10-letter-long sequences that occur more than once in a DNA string.",
      QuestionCategories: ["Algorithms", "Bit Manipulation"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 9,
      QuestionTitle: "Course Schedule",
      QuestionDescription:
        "Determine if you can finish all courses given prerequisites.",
      QuestionCategories: ["Data Structures", "Algorithms"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 10,
      QuestionTitle: "LRU Cache Design",
      QuestionDescription: "Design and implement an LRU cache.",
      QuestionCategories: ["Data Structures"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 11,
      QuestionTitle: "Longest Common Subsequence",
      QuestionDescription:
        "Return the length of the longest common subsequence between two strings.",
      QuestionCategories: ["Strings", "Algorithms"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 12,
      QuestionTitle: "Rotate Image",
      QuestionDescription: "Rotate an n x n 2D matrix by 90 degrees clockwise.",
      QuestionCategories: ["Arrays", "Algorithms"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 13,
      QuestionTitle: "Airplane Seat Assignment Probability",
      QuestionDescription:
        "Compute the probability the nth passenger gets their seat.",
      QuestionCategories: ["Brainteaser"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 14,
      QuestionTitle: "Validate Binary Search Tree",
      QuestionDescription: "Determine if a binary tree is a valid BST.",
      QuestionCategories: ["Data Structures", "Algorithms"],
      QuestionComplexity: "medium",
    },
    {
      questionId: 15,
      QuestionTitle: "Sliding Window Maximum",
      QuestionDescription: "Return the max in each sliding window of size k.",
      QuestionCategories: ["Arrays", "Algorithms"],
      QuestionComplexity: "hard",
    },
    {
      questionId: 16,
      QuestionTitle: "N-Queen Problem",
      QuestionDescription:
        "Return all distinct solutions to the n-queens puzzle.",
      QuestionCategories: ["Algorithms"],
      QuestionComplexity: "hard",
    },
    {
      questionId: 17,
      QuestionTitle: "Serialize and Deserialize a Binary Tree",
      QuestionDescription:
        "Design an algorithm to serialize and deserialize a binary tree.",
      QuestionCategories: ["Data Structures", "Algorithms"],
      QuestionComplexity: "hard",
    },
    {
      questionId: 18,
      QuestionTitle: "Wildcard Matching",
      QuestionDescription: "Implement wildcard pattern matching with ? and *.",
      QuestionCategories: ["Strings", "Algorithms"],
      QuestionComplexity: "hard",
    },
    {
      questionId: 19,
      QuestionTitle: "Chalkboard XOR Game",
      QuestionDescription:
        "Determine if Alice wins given optimal play in the XOR game.",
      QuestionCategories: ["Brainteaser", "Algorithms"],
      QuestionComplexity: "hard",
    },
    {
      questionId: 20,
      QuestionTitle: "Trips and Users",
      QuestionDescription:
        "Calculate the cancellation rate of trips with unbanned users.",
      QuestionCategories: ["Databases"],
      QuestionComplexity: "hard",
    },
  ];

  await questionModel.insertMany(questions);
  console.log("Seeded 20 test questions successfully!");
}
