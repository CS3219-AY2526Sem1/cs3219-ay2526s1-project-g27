/*
AI Assistance Disclosure:
Tool: ChatGPT 5 / Claude Sonnet 4.5 / Gemini 2.5 Flash date: 2025-10-13 12:30
Scope: 
- Request for a timer at the application screen such that navigating across different pages
continues to display the match timer
Author review: 
- Verfied for correctness by testing
*/

import { useMatching } from "@/context/MatchContext";

export default function QueueTimerDisplay() {
    const { isMatching, timer, stopMatching } = useMatching();

    if (!isMatching) return null;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const leaveQueue = (): void => {
        console.log("Attempting to leave queue...");
        stopMatching();
    }

    return (
      <div className="fixed top-20 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 z-50">
        Matching... {formatTime(timer)}
        {/* Cancel button */}
        <button
          onClick={leaveQueue}
          className="text-gray-300 hover:text-red-400 transition-colors"
          aria-label="Cancel Matching"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
}
