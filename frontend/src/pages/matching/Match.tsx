/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Pro date: 2025‑11-08
Scope: 
- Generated simple loading spinner for UI
Author review: 
- Verfied for correctness by testing
*/

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
import { useEffect, useState } from "react";
import apiClient from "@/api/apiClient";   
import { useAuth } from '@/context/AuthContext';


export default function MatchingPage() {
  // based on currently seeded values from question service
  const difficulties = ['easy', 'medium', 'hard'];
  const topics = [
    "Algorithms",
    "Arrays",
    "Bit Manipulation",
    "Brainteaser",
    "Data Structures",
    "Databases",
    "Recursion",
    "Strings"
  ];

  //@ts-ignore
  const { isMatching, timer, showError, errorMessage, showAcceptMatch, matchFound, topic, difficulty, setTopic, setDifficulty, startMatching, stopMatching, acceptMatch } = useMatching();

  {/* Logic for changing dialog on accept */}
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false);
  useEffect(() => {
    if (!showAcceptMatch) {
      setIsWaitingForPartner(false);
    }
  }, [showAcceptMatch]);

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
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready, set, Match!
          </h2>
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
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Match Success!</DialogTitle>
            <DialogDescription className="text-base">
              Redirecting to collaboration space...
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Match Accept Dialog */}
      <Dialog open={showAcceptMatch}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
          // This prevents closing the dialog by clicking the overlay
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          {!isWaitingForPartner ? (
            // STATE 1: Show Accept/Decline options
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Match Found!</DialogTitle>
                <DialogDescription className="text-base">
                  You've been matched with a peer.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={stopMatching} 
                  variant="outline"
                  className="flex-1"
                >
                  Decline
                </Button>
                <Button
                  onClick={() => {
                    acceptMatch();
                    setIsWaitingForPartner(true);
                  }}
                  className="flex-1"
                >
                  Accept
                </Button>
              </div>
            </>
          ) : (
            // STATE 2: Show "Waiting for partner..."
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Match Accepted!</DialogTitle>
                <DialogDescription className="text-base">
                  Waiting for your partner to accept...
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center items-center h-24">
                {/* Simple loading spinner (AI-generated) */}
                <svg
                  className="animate-spin h-8 w-8 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};