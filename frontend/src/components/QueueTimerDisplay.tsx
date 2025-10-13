import { useMatching } from "@/context/MatchContext";

export default function QueueTimerDisplay() {
    const { isMatching, timer } = useMatching();

    if (!isMatching) return null;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const leaveQueue = (): void => {
      console.log("Pressed!");
    }

    return (
      <div className="fixed top-20 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 z-50">
        Matching... {formatTime(timer)}
      </div>
    );
}
