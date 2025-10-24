import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "@/api/apiClient";        
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

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

    const { user, jwt } = useAuth(); 
    const userId = user?.id;

    const navigate = useNavigate();
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
        console.log('🔑 JWT token length:', jwt?.length);
        console.log('🔑 JWT parts:', jwt?.split('.').map(part => part.length));
    
        setIsMatching(true);
        
        const tokenValue = jwt?.replace('Bearer ', '');
        const qs = tokenValue ? `?token=${encodeURIComponent(tokenValue)}` : "";
        const sseUrl = `/api/matching/queue-events/${userId}${qs}`;

        console.log('🔗 SSE URL length:', sseUrl.length);
        console.log('🔗 SSE URL:', sseUrl);
        
        const matchingEventSource = new EventSource(sseUrl, {
            withCredentials: false 
        });
        setEventSource(matchingEventSource);
        
        matchingEventSource.onopen = () => {
            console.log("SSE connection established, now adding user to queue...");

            const userData = {
                userId,
                topic,
                difficulty,
            };

            // ✅ FIXED: No query string - token is in Authorization header via apiClient
            apiClient.post(`/matching/queue`, userData)
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
            console.log("Redirection to collaboration space!");
            setShowAcceptMatch(false);
            setIsMatching(false);
            setMatchFound(true);
            const data = JSON.parse(event.data);
            console.log("data received", data);
            console.log("signed data received", data.signedData);
            console.log("users", data.userA, data.userB);
            const matchedUserId = data.userA === userId ? data.userB : data.userA
            const matchedUser = {
                name: matchedUserId,
                level: difficulty,
                topic: topic
            }
            console.log("matched user", matchedUser);
            // TODO: add redirection to collaboration page
            localStorage.setItem('matchToken', data.signedData);
            navigate(`/collab`);
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
        
        matchingEventSource.addEventListener("terminate", () => {
            console.log("close connection");
            matchingEventSource.close();
            setIsMatching(false);
        })
        
        matchingEventSource.addEventListener("matchAccepted", (event) => {
            const data = JSON.parse(event.data);
            console.log(data.message);
        });
        
        matchingEventSource.addEventListener("noQuestion", (event) => {
            const data = JSON.parse(event.data);
            console.log(data.message);
            handleErrorDisplay(data.message);
        });
        
        matchingEventSource.addEventListener("serverError", (event) => {
            const data = JSON.parse(event.data);
            console.log(data.message);
            handleErrorDisplay(data.message);
        });
    };
 
    const acceptMatch = () => {
        // ✅ FIXED: No query string - token is in Authorization header via apiClient
        const matchData = {
            userId: userId,
            matchId: matchId
        };
        
        apiClient.post(`/matching/matches`, matchData)
            .then(response => {
                console.log(response.data.message);
            })
            .catch(error => {
                handleErrorDisplay(error.response?.data?.error || "Something went wrong, please queue again.");
            })
    };
    
    const stopMatching = () => {
        // ✅ FIXED: No query string - token is in Authorization header via apiClient
        apiClient.delete(`/matching/queue/${userId}`)
            .then(response => {
                console.log(response.data.message);
                setIsMatching(false);
            })
            .catch(error => {
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
        <MatchingContext.Provider value={{ 
            isMatching, 
            timer, 
            showError, 
            errorMessage, 
            showAcceptMatch, 
            matchFound, 
            topic, 
            difficulty, 
            setTopic, 
            setDifficulty, 
            startMatching, 
            stopMatching, 
            acceptMatch, 
            resetMatchState 
        }}>
            {children}
        </MatchingContext.Provider>
    );
}

export function useMatching() {
    const context = useContext(MatchingContext);
    if (!context) throw new Error("useMatching must be used within MatchingProvider");
    return context;
}