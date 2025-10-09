import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MatchedUserType {
  name: string;
  level: string;
  topic: string;
  rating: string;
  experience: string;
}

export default function MatchingPage() {
  const [difficulty, setDifficulty] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [showError, setShowError] = useState<boolean>(false);
  const [matchFound, setMatchFound] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<MatchedUserType | null>(null);

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const topics = ['Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'Trees', 'Sorting'];

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isMatching) {
      interval = setInterval(() => {
        setTimer((prev: number) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMatching]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartMatching = (): void => {
    if (!difficulty || !topic) {
      setShowError(true);
      return;
    }
    
    setShowError(false);
    setIsMatching(true);

    // Simulate finding a match after 5 seconds
    setTimeout(() => {
      setIsMatching(false);
      setMatchFound(true);
      setMatchedUser({
        name: 'Alex Johnson',
        level: difficulty,
        topic: topic,
        rating: '1850',
        experience: '3 years'
      });
    }, 5000);
  };

  const handleCloseDialog = (): void => {
    setMatchFound(false);
    setMatchedUser(null);
    setDifficulty('');
    setTopic('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">
          {/* Difficulty Select */}
          <Select value={difficulty} onValueChange={setDifficulty} disabled={isMatching}>
            <SelectTrigger className="w-full h-16 text-lg bg-white border-2 border-gray-300 rounded-lg">
              <SelectValue placeholder="Difficulty Level" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((level) => (
                <SelectItem key={level} value={level} className="text-lg">
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Topic Select */}
          <Select value={topic} onValueChange={setTopic} disabled={isMatching}>
            <SelectTrigger className="w-full h-16 text-lg bg-white border-2 border-gray-300 rounded-lg">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t} value={t} className="text-lg">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Start Matching Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleStartMatching}
              disabled={isMatching}
              className="h-16 px-12 text-lg bg-white text-black border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMatching ? `Matching... ${formatTime(timer)}` : 'Start Matching!'}
            </Button>
          </div>

          {/* Error Message */}
          {showError && (
            <div className="flex items-center justify-center gap-2 text-gray-800">
              <AlertCircle className="w-5 h-5" />
              <span>No peer found. Try again or change criteria.</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Found Dialog */}
      <Dialog open={matchFound} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Match Found! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              You've been matched with a peer
            </DialogDescription>
          </DialogHeader>
          {matchedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Name:</span>
                  <span className="text-lg">{matchedUser.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Difficulty:</span>
                  <span className="text-lg">{matchedUser.level}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Topic:</span>
                  <span className="text-lg">{matchedUser.topic}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Rating:</span>
                  <span className="text-lg">{matchedUser.rating}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-600">Experience:</span>
                  <span className="text-lg">{matchedUser.experience}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCloseDialog} className="flex-1">
                  Start Session
                </Button>
                <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};