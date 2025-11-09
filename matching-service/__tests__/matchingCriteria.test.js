const { executeMatchingAlgorithm } = require('../src/queue/matchCriteria');

describe("executeMatchingAlgorithm", () => {
  const sampleQueue = [
    { data: { topic: "Arrays", difficulty: "easy", cancelled: false } },
    { data: { topic: "Arrays", difficulty: "medium", cancelled: false } },
    { data: { topic: "Graphs", difficulty: "hard", cancelled: false } },
    { data: { topic: "DP", difficulty: "hard", cancelled: false } },
    { data: { topic: "Arrays", difficulty: "hard", cancelled: true } }
  ];

  it("returns exact matches for first 3 attempts", () => {
    let jobInProcess;
    let result;
    jobInProcess = { data: { topic: "Arrays", difficulty: "easy" }, attemptsMade: 1 };
    result = executeMatchingAlgorithm(sampleQueue, jobInProcess);
    expect(result).toEqual([
      { data: { topic: "Arrays", difficulty: "easy", cancelled: false } }
    ]);

    jobInProcess = { data: { topic: "DP", difficulty: "medium" }, attemptsMade: 3 };
    result = executeMatchingAlgorithm(sampleQueue, jobInProcess);
    expect(result).toEqual([]);
  });

  it("returns weighted matches after 3 attempts", () => {
    let jobInProcess;
    let result;
    jobInProcess = { data: { topic: "Arrays", difficulty: "easy" }, attemptsMade: 4 };
    result = executeMatchingAlgorithm(sampleQueue, jobInProcess);
    expect(result).toEqual([
        { data: { topic: "Arrays", difficulty: "easy", cancelled: false } },
        { data: { topic: "Arrays", difficulty: "medium", cancelled: false } }
    ])

    jobInProcess = { data: { topic: "DP", difficulty: "medium" }, attemptsMade: 4 };
    result = executeMatchingAlgorithm(sampleQueue, jobInProcess);
    expect(result).toEqual([
        { data: { topic: "DP", difficulty: "hard", cancelled: false } },
    ]);
  });

  it("returns empty array if no jobs match", () => {
    let jobInProcess;
    let result;
    jobInProcess = { data: { topic: "Strings", difficulty: "hard" }, attemptsMade: 1 };
    result = executeMatchingAlgorithm(sampleQueue, jobInProcess);
    expect(result).toEqual([]);
    jobInProcess = { data: { topic: "Strings", difficulty: "hard" }, attemptsMade: 4 };
    result = executeMatchingAlgorithm(sampleQueue, jobInProcess);
    expect(result).toEqual([]);
  });
});