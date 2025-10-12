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
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

interface MatchedUserType {
  name: string;
  level: string;
  topic: string;
}

export default function MatchingPage() {
  const [difficulty, setDifficulty] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [matchFound, setMatchFound] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<MatchedUserType | null>(null);
  const [matchId, setMatchId] = useState<string>('')
  const [showAcceptMatch, setShowAcceptMatch] = useState<boolean>(false);

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const topics = ['Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'Trees', 'Sorting'];
  const { user } = useAuth();
  const userId = user?.id;

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
    handleErrorDisplay('');
    if (!difficulty || !topic) {
      handleErrorDisplay('No peer found. Try again or change criteria.');
      return;
    }
    setIsMatching(true);
    const matchingEventSource = new EventSource(`http://localhost:3001/queue-events/${userId}`, {
      withCredentials: true
    });
    matchingEventSource.onopen = () => {
      console.log("SSE connection established, now adding user to queue...");

      const userData = {
        userId,
        topic,
        difficulty,
      };

      axios.post("http://localhost:3001/queue", userData)
        .then(response => {
          if (response.status === 200) {
            console.log('Added user successfully to queue');
          }
        })
        .catch(error => {
          handleErrorDisplay(error.response?.data?.error || "Failed to connect to queue");
        });
    };
    matchingEventSource.addEventListener("matchFound", (event) => {
      setShowAcceptMatch(true);
      setTimeout(() => {
        setShowAcceptMatch(false);
      }, 14000);
      const data = JSON.parse(event.data);
      setMatchId(data.matchId);
    });
    matchingEventSource.addEventListener("matchSuccess", (event) => {
      // TODO: need to modify the data passed in here
      console.log("Redirection to collaboration space!");
      setShowAcceptMatch(false);
      setIsMatching(false);
      setMatchFound(true);
      const data = JSON.parse(event.data);
      const matchedUserId = data.userA === userId ? data.userB : data.userA
      const matchedUser = {
        name: matchedUserId,
        level: difficulty,
        topic: topic
      }
      setMatchedUser(matchedUser)
    });
    matchingEventSource.addEventListener("matchFailed", (event) => {
      console.log('match failed event', event);
      const data = JSON.parse(event.data);
      handleErrorDisplay(data.message);
    });
    matchingEventSource.addEventListener("requeue", (event) => {
      const data = JSON.parse(event.data);
      console.log(data.message);
      setMatchId('');
      setErrorMessage(data.message);
    });
    // for both match failed and success events
    matchingEventSource.addEventListener("terminate", (event) => {
      console.log("close connection");
      matchingEventSource.close();
      setIsMatching(false);
    })
    matchingEventSource.addEventListener("matchAccepted", (event) => {
      // Just for logging purposes
      const data = JSON.parse(event.data);
      console.log(data.message);
    });
    matchingEventSource.addEventListener("noQuestion", (event) => {
      // for logging purposes
      const data = JSON.parse(event.data);
      console.log(data.message);
      handleErrorDisplay(data.message);
    });
  };

  const handleAcceptMatch = (): void => {
    const matchData = {
      userId: userId,
      matchId: matchId
    };
    axios.post("http://localhost:3001/matches", matchData).then(response => {
      // Can be deleted later, for now, to check if it works
      console.log(response.data.message);
    }).catch(error => {
      handleErrorDisplay(error.response?.data?.error || "Something went wrong, please queue again.");
    })
  }

  const handleErrorDisplay = (errorMessage: string): void => {
    setErrorMessage(errorMessage);
    setShowError(true);
  }

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
              <span>{ errorMessage }</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Success Dialog */}
      <Dialog open={matchFound} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Match Success 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Redirecting to collaboration space...
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

      {/* Match Accept Dialog */}
      <Dialog open={showAcceptMatch}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Match Found! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              You've been matched with a peer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAcceptMatch} className="flex-1">
                Accept
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};