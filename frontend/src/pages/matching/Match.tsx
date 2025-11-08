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
import { useMatching } from '@/context/MatchContext';
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import apiClient from "@/api/apiClient";   
import { useAuth } from '@/context/AuthContext';

// interface MatchedUserType {
//   name: string;
//   level: string;
//   topic: string;
// }
// TODO: remove user from matching api + consider how the state can be kept whenever user is in the queue when navigate between pages
export default function MatchingPage() {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const topics = ['Arrays', 'Strings', 'Dynamic Programming', 'Graphs', 'Trees', 'Sorting', 'Data Structures',
            'Algorithms'];

  //@ts-ignore
  const { isMatching, timer, showError, errorMessage, showAcceptMatch, matchFound, topic, difficulty, setTopic, setDifficulty, startMatching, stopMatching, acceptMatch } = useMatching();

  const navigate = useNavigate();
  const { jwt } = useAuth();
  const tokenValue = jwt?.replace('Bearer ', ''); 
  const qs = tokenValue ? `?token=${encodeURIComponent(tokenValue)}` : "";

  useEffect(() => {
    const localToken = localStorage.getItem("matchToken");

    if (localToken) {
      console.log("Already in collaboration, localStorage check");
      apiClient.get(`/collab/match/status/${localToken}${qs}`)
      .then(response => {
          console.log("Response check", response);
            if (response.data.status === 'in_match') {
                navigate("/collab");
            } else if (response.data.status === 'no_match') {
              // if token is stale, clean it up
              localStorage.removeItem("matchToken");
            }
        })
        .catch(error => {
            console.error("Error checking match status:", error);
        });
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <SelectContent className="bg-white">
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
            <SelectContent className="bg-white">
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
              onClick={startMatching}
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
      <Dialog open={matchFound}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Match Success 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Redirecting to collaboration space...
            </DialogDescription>
          </DialogHeader>
          {/* {matchedUser && ( */}
          {(
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Name:</span>
                  {/* <span className="text-lg">{matchedUser.name}</span> */}
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Difficulty:</span>
                  {/* <span className="text-lg">{matchedUser.level}</span> */}
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-semibold text-gray-600">Topic:</span>
                  {/* <span className="text-lg">{matchedUser.topic}</span> */}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Match Accept Dialog */}
      {/* TODO: Need to remove closing dialog option*/}
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
              {/* TODO: Need to disable button after pressing accept*/}
              <Button onClick={acceptMatch} className="flex-1">
                Accept
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};