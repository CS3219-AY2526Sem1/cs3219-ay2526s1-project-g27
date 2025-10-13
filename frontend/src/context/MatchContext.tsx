import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

interface MatchingContextType {
    isMatching: boolean;
    timer: number;
    showError: boolean;
    errorMessage: string;
    showAcceptMatch: boolean;
    matchFound: boolean;
    topic: string;
    difficulty: string;
    setTopic: React.Dispatch<React.SetStateAction<string>>;
    setDifficulty: React.Dispatch<React.SetStateAction<string>>;
    startMatching: () => void;
    stopMatching: () => void;
    acceptMatch: () => void;
    resetMatchState: () => void;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export function MatchingProvider({ children }: { children: React.ReactNode }) {
    const [topic, setTopic] = useState<string>('');
    const [difficulty, setDifficulty] = useState<string>('');
    const [isMatching, setIsMatching] = useState(false);
    const [timer, setTimer] = useState(0);
    const [matchId, setMatchId] = useState<string | null>(null);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);
    const [showError, setShowError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showAcceptMatch, setShowAcceptMatch] = useState<boolean>(false);
    const [matchFound, setMatchFound] = useState<boolean>(false);

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

    const startMatching = () => {
        setShowError(false);
        if (!difficulty || !topic) {
            handleErrorDisplay('No peer found. Try again or change criteria.');
            return;
        }
        setIsMatching(true);
        const matchingEventSource = new EventSource(`http://localhost:3001/queue-events/${userId}`, {
            withCredentials: true
        });
        setEventSource(matchingEventSource);
        matchingEventSource.onopen = () => {
            console.log("SSE connection established, now adding user to queue...");

            const userData = {
                userId,
                topic,
                difficulty,
            };

            axios.post("http://localhost:3001/queue", userData).then(response => {
                if (response.status === 200) {
                    // for logging purposes
                    console.log('Added user successfully to queue');
                }
            }).catch(error => {
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
            // TODO: add redirection to collaboration logic here
            console.log("Redirection to collaboration space!");
            setShowAcceptMatch(false);
            setIsMatching(false);
            setMatchFound(true);
            const data = JSON.parse(event.data);
            console.log("data received", data);
            console.log("signed data received", data.signedData); // this is the signed JWT
            console.log("users", data.userA, data.userB);
            const matchedUserId = data.userA === userId ? data.userB : data.userA
            const matchedUser = {
                name: matchedUserId,
                level: difficulty,
                topic: topic
            }
            // setMatchedUser(matchedUser)
            console.log("matched user", matchedUser);
            // TODO: add redirection to collaboration page
            setTimeout(() => {
                resetMatchState();
            }, 5000)
        });
        matchingEventSource.addEventListener("matchFailed", (event) => {
            console.log('match failed event', event);
            const data = JSON.parse(event.data);
            handleErrorDisplay(data.message);
        });
        matchingEventSource.addEventListener("requeue", (event) => {
            const data = JSON.parse(event.data);
            console.log(data.message);
            setMatchId(null);
            handleErrorDisplay(data.message);
        });
        // for both match failed and success events
        matchingEventSource.addEventListener("terminate", (event) => {
            console.log("close connection");
            matchingEventSource.close();
            setIsMatching(false);
        })
        matchingEventSource.addEventListener("matchAccepted", (event) => {
            // for logging purposes
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
 
    const acceptMatch = () => {
        const matchData = {
            userId: userId,
            matchId: matchId
        };
        axios.post("http://localhost:3001/matches", matchData).then(response => {
            // for logging purposes
            console.log(response.data.message);
        }).catch(error => {
            handleErrorDisplay(error.response?.data?.error || "Something went wrong, please queue again.");
        })
    };
    
    const stopMatching = () => {
        axios.delete(`http://localhost:3001/queue/${userId}`).then(response => {
            console.log(response.data.message);
            setIsMatching(false);
        }).catch(error => {
            handleErrorDisplay(error.response?.data?.error || "Something went wrong.");
        })
    };

    const handleErrorDisplay = (errorMessage: string): void => {
        setErrorMessage(errorMessage);
        setShowError(true);
    }

    const resetMatchState = () => {
        setTopic('');
        setDifficulty('');
        setIsMatching(false);
        setTimer(0);
        setShowError(false);
        setErrorMessage('');
        setShowAcceptMatch(false);
        setMatchFound(false);
        setMatchId(null);
        eventSource?.close()
    };

    return (
        <MatchingContext.Provider value={{ isMatching, timer, showError, errorMessage, showAcceptMatch, matchFound, topic, difficulty, setTopic, setDifficulty, startMatching, stopMatching, acceptMatch, resetMatchState }}>
            {children}
        </MatchingContext.Provider>
    );
}

export function useMatching() {
    const context = useContext(MatchingContext);
    if (!context) throw new Error("useMatching must be used within MatchingProvider");
    return context;
}
