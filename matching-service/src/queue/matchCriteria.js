function executeMatchingAlgorithm(allJobsInQueue, jobInProcess) {
    const { topic, difficulty } = jobInProcess.data;
    const { attemptsMade } = jobInProcess;

    // Convert difficulty to numeric scale
    const difficultyToNum = (diff) => {
        const levels = { easy: 1, medium: 2, hard: 3 };
        const normalized = diff.toLowerCase();
        return levels[normalized] ?? 0;
    };

    const diffValue = difficultyToNum(difficulty);

    // Compute similarity score between 0 and 1
    const computeScore = (job) => {
        if (job.data.cancelled) return 0;

        const sameTopic = job.data.topic === topic ? 1 : 0;
        const diffScore = 1 - Math.min(Math.abs(difficultyToNum(job.data.difficulty) - diffValue) / 2, 1); 
        // e.g. if diff difference is 0 → 1.0 score; diff = 1 → 0.5; diff = 2 → 0

        // Weights (for now, based on topic and difficulty only, hardcoded weight)
        const topicWeight = 0.7;
        const difficultyWeight = 0.3;

        // Weighted total score
        return topicWeight * sameTopic + difficultyWeight * diffScore;
    };

    // Exact match for first 3 attempts
    if (attemptsMade <= 3) {
        return allJobsInQueue.filter(
            job =>
                !job.data.cancelled &&
                job.data.topic === topic &&
                job.data.difficulty === difficulty
        );
    }

    // After 3 attempts → compute weighted matches
    const scoredJobs = allJobsInQueue
        .map(job => ({
            job,
            score: computeScore(job)
        }))
        .filter(({ score }) => score >= 0.6)
        .sort((a, b) => b.score - a.score)  
        .map(({ job }) => job);

    return scoredJobs;
}

module.exports = { executeMatchingAlgorithm };