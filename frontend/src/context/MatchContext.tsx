/*
AI Assistance Disclosure:
Tool: ChatGPT 5 date: 2025-10-13 12:30
Tool: ChatGPT 5 / Claude Sonnet 4.5 / Gemini 2.5 Flash  date: 2025-10-26/27/30
Scope: 
- Ensure Match Persistence state across the entire application
- Synchronization of multiple tabs of the same browser to show the same matching page to resolve bug 
that opening another tab allows user to enter the queue.
Author review: 
- Followed the guideline of how the original matching page logic should be separated with an overarching context.
- Copied and pasted the recommended debugging code for multiple tab synchronization.
- Verfied for correctness by testing and works.
*/

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
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

interface MatchingState {
    isMatching: boolean;
    topic: string;
    difficulty: string;
    matchId: string | null;
    startTime: number | null;
    endTime: number | null;
    userId: string | null;
    showError: boolean;
    errorMessage: string;
    showAcceptMatch: boolean;
}


const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

const STORAGE_KEY = 'matching-state';
const LEAD_TAB_KEY = 'matching-lead-tab';

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
    const [endTime, setEndTime] = useState<number | null>(null);

    const [isLeadTab, setIsLeadTab] = useState(false);

    const { user, jwt } = useAuth(); 
    const userId = user?.id;
    const navigate = useNavigate();

    const tabId = useRef(`tab-${Date.now()}-${Math.random()}`);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const prevUserId = useRef<string | null>(null);
    const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

    // Sync ALL state to localStorage immediately
    const syncStateToStorage = (updates: Partial<MatchingState>) => {
        const currentState = getStoredState();
        const newState = { ...currentState, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        
        // Trigger storage event for other tabs
        window.dispatchEvent(new Event('storage'));
    };

    const getStoredState = (): MatchingState => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {
            isMatching: false,
            topic: '',
            difficulty: '',
            matchId: null,
            startTime: null,
            endTime: null, // 🆕
            userId: null,
            showError: false,
            errorMessage: '',
            showAcceptMatch: false
        };

    };

    // Load state from localStorage
    const loadStateFromStorage = () => {
        const stored = getStoredState();
        if (stored.userId === userId) {
            setTopic(stored.topic);
            setDifficulty(stored.difficulty);
            setIsMatching(stored.isMatching);
            setMatchId(stored.matchId);
            setEndTime(stored.endTime);
            setShowError(stored.showError);
            setErrorMessage(stored.errorMessage);
            setShowAcceptMatch(stored.showAcceptMatch);
            
            if (stored.startTime && stored.isMatching) {
                const elapsed = Math.floor((Date.now() - stored.startTime) / 1000);
                setTimer(elapsed);
            }
        }
    };

    const tryBecomeLeadTab = () => {
        const stored = localStorage.getItem(LEAD_TAB_KEY);
        const now = Date.now();

        if (!stored) {
            localStorage.setItem(LEAD_TAB_KEY, JSON.stringify({ tabId: tabId.current, lastHeartbeat: now }));
            setIsLeadTab(true);
            console.log('🏆 This tab is now the LEAD tab');
            return true;
        }

        const leadInfo = JSON.parse(stored);

        // Check if leader is dead (no heartbeat for 3 seconds)
        if (now - leadInfo.lastHeartbeat > 3000) {
            localStorage.setItem(LEAD_TAB_KEY, JSON.stringify({ tabId: tabId.current, lastHeartbeat: now }));
            setIsLeadTab(true);
            console.log('🏆 Previous lead tab died, this tab is now LEAD');
            return true;
        }

        // Check if I'm already the leader
        if (leadInfo.tabId === tabId.current) {
            setIsLeadTab(true);
            return true;
        }

        setIsLeadTab(false);
        console.log('👥 This tab is a FOLLOWER tab');
        return false;
    };

    // Send heartbeat if lead tab
    useEffect(() => {
        if (isLeadTab) {
            const sendHeartbeat = () => {
                localStorage.setItem(LEAD_TAB_KEY, JSON.stringify({ 
                    tabId: tabId.current, 
                    lastHeartbeat: Date.now() 
                }));
            };
            
            sendHeartbeat();
            heartbeatInterval.current = setInterval(sendHeartbeat, 1000);
        }

        return () => {
            if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
                heartbeatInterval.current = null;
            }
        };
    }, [isLeadTab]);

    // Monitor for dead lead tab and take over if needed
    useEffect(() => {
        const checkLeadTab = setInterval(() => {
            const stored = getStoredState();
            if (!isLeadTab && stored.isMatching && stored.userId === userId) {
                const becameLeader = tryBecomeLeadTab();
                if (becameLeader && !eventSource) {
                    console.log('🔄 Took over leadership, setting up SSE');
                    setupSSE(true); // rejoin queue
                }
            }
        }, 2000);

        return () => clearInterval(checkLeadTab);
    }, [isLeadTab, eventSource, userId]);

    // Clean up when tab closes
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isLeadTab) {
                const stored = localStorage.getItem(LEAD_TAB_KEY);
                if (stored) {
                    const leadInfo = JSON.parse(stored);
                    if (leadInfo.tabId === tabId.current) {
                        localStorage.removeItem(LEAD_TAB_KEY);
                    }
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isLeadTab]);

    // Initialize from localStorage on mount
    useEffect(() => {
        if (!userId) return;

        // If user changed (or first load), reset state
        if (prevUserId.current && prevUserId.current !== userId) {
            console.log('🧹 User changed, clearing previous state');
            resetMatchState();
        }

        prevUserId.current = userId;

        // On login or user change
        const storedState = getStoredState();

        // Clear old state if different user
        if (storedState.userId && storedState.userId !== userId) {
            console.log('🧹 Clearing stale state for new user');
            resetMatchState(); // clears both memory and storage
        } else if (storedState.isMatching && storedState.userId === userId) {
            console.log('🔄 Restoring state for current user');
            loadStateFromStorage();
            if (tryBecomeLeadTab()) {
                setTimeout(() => setupSSE(false), 100);
            }
        }
    }, [userId]);

    // Listen to localStorage changes (from other tabs)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && userId) {
                console.log('📦 Storage changed, reloading state');
                loadStateFromStorage();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [userId]);

    // Initialize broadcast channel (for SSE events only)
    useEffect(() => {
        channelRef.current = new BroadcastChannel('matching-sync');

        channelRef.current.onmessage = (event) => {
            const { type, payload } = event.data;
            
            // Ignore own messages
            if (payload?.tabId === tabId.current) return;

            switch (type) {
                case 'SSE_EVENT':
                    // All tabs process SSE events
                    if (payload.userId === userId) {
                        handleSSEEvent(payload.event, payload.data);
                    }
                    break;

                case 'LEAD_TAKEN':
                    // Another tab became leader
                    if (payload.userId === userId && payload.leadTabId !== tabId.current) {
                        setIsLeadTab(false);
                        console.log('👥 Another tab became LEAD, this is now FOLLOWER');
                    }
                    break;
            }
        };

        return () => channelRef.current?.close();
    }, [userId]);

    // Timer effect - runs on ALL tabs, synced via endTime from localStorage
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;

        if (isMatching && endTime) {
            const updateTimer = () => {
                if (showAcceptMatch) return; // ❌ freeze timer when accept match is showing

                const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
                setTimer(remaining);

                // Auto-stop timer when it hits zero
                if (remaining <= 0 && interval) {
                    clearInterval(interval);
                }
            };

            updateTimer(); // Run immediately
            interval = setInterval(updateTimer, 1000);
        } else {
            setTimer(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isMatching, endTime, showAcceptMatch]);


    // Handle SSE events - runs on ALL tabs
    const handleSSEEvent = (eventType: string, data: any) => {
        console.log(`📡 Processing SSE event: ${eventType}`, data);
        
        switch (eventType) {
            case 'matchFound':
                setShowAcceptMatch(true);
                setMatchId(data.matchId);
                syncStateToStorage({ matchId: data.matchId, showAcceptMatch: true });
                setTimeout(() => {
                    setShowAcceptMatch(false);
                    syncStateToStorage({ showAcceptMatch: false });
                }, 14000);
                break;

            case 'matchSuccess':
                setShowAcceptMatch(false);
                setIsMatching(false);
                setMatchFound(true);
                setEndTime(null);
                localStorage.setItem("question", JSON.stringify(data.question));
                localStorage.setItem('matchToken', data.signedData);
                syncStateToStorage({ 
                    isMatching: false, 
                    startTime: null, 
                    showAcceptMatch: false 
                });
                navigate(`/collab`);
                setTimeout(() => resetMatchState(), 5000);
                break;

            case 'matchFailed':
            case 'noQuestion':
            case 'serverError':
                const errorMsg = data.message || "Unable to find a match";
                setErrorMessage(errorMsg);
                setShowError(true);
                setIsMatching(false);
                setEndTime(null);
                setMatchId(null);
                syncStateToStorage({ 
                    isMatching: false, 
                    startTime: null, 
                    matchId: null,
                    showError: true,
                    errorMessage: errorMsg
                });
                if (isLeadTab) {
                    cleanupSSE();
                    localStorage.removeItem(LEAD_TAB_KEY);
                    setIsLeadTab(false);
                }
                break;

            case 'terminate':
                setIsMatching(false);
                setEndTime(null);
                setMatchId(null);
                syncStateToStorage({ 
                    isMatching: false, 
                    startTime: null, 
                    matchId: null 
                });
                if (isLeadTab) {
                    cleanupSSE();
                    localStorage.removeItem(LEAD_TAB_KEY);
                    setIsLeadTab(false);
                }
                break;

            case 'requeue':
                setMatchId(null);
                const requeueMsg = data.message || "Match cancelled, searching again...";
                setErrorMessage(requeueMsg);
                setShowError(true);
                // 🕐 restart countdown from 1 minute
                const newEndTime = Date.now() + 60 * 1000;
                setEndTime(newEndTime);
                setTimer(60);
                syncStateToStorage({ 
                    matchId: null,
                    showError: true,
                    errorMessage: requeueMsg
                });
                break;

            case 'matchAccepted':
                console.log('Match accepted:', data.message);
                break;

            case 'userAdded':
                console.log('User added to queue:', data.message);
                break;
        }
    };

    const cleanupSSE = () => {
        if (eventSource) {
            console.log('🧹 Closing SSE connection');
            eventSource.close();
            setEventSource(null);
        }
    };

    const setupSSE = async(shouldAddToQueue: boolean) => {
        if (!userId || !jwt) {
            console.warn('⚠️ Cannot setup SSE: missing userId or jwt');
            return;
        }

        // Double-check leadership from localStorage (don't trust state yet)
        const leadInfo = localStorage.getItem(LEAD_TAB_KEY);
        if (leadInfo) {
            const lead = JSON.parse(leadInfo);
            if (lead.tabId !== tabId.current) {
                console.log('⚠️ Not lead tab (checked localStorage), skipping SSE setup');
                return;
            }
        }

        console.log('✅ Confirmed lead tab, proceeding with SSE setup');

        // Close any existing connection
        cleanupSSE();

        const tokenValue = jwt.replace('Bearer ', '');
        const sseUrl = `/api/matching/queue-events/${userId}?token=${encodeURIComponent(tokenValue)}`;

        // First, check if we can connect
        const canConnect = await fetch(sseUrl, { method: 'HEAD' })
            .then(res => {
                if (res.status === 409 || res.status === 429) throw new Error('User already connected elsewhere');
                if (!res.ok) throw new Error('Failed to connect to SSE');
                return true;
            })
            .catch(err => {
                setErrorMessage(err.message);
                setShowError(true);
                setIsMatching(false);
                syncStateToStorage({ 
                    isMatching: false, 
                    showError: true, 
                    errorMessage: err.message 
                });
                return false;
            });

        if (!canConnect) return; // stop here if user is already connected

        console.log('🔗 Lead tab establishing SSE connection');
        const matchingEventSource = new EventSource(sseUrl, { withCredentials: false });
        setEventSource(matchingEventSource);

        matchingEventSource.onopen = () => {
            console.log("✅ SSE connection established (lead tab)");
            
            if (shouldAddToQueue) {
                apiClient.post(`/matching/queue`, { userId, topic, difficulty })
                    .then(() => {
                        console.log('✅ User added to queue');
                    })
                    .catch(error => {
                        const errorMsg = error.response?.data?.error || "Failed to connect to queue";
                        setErrorMessage(errorMsg);
                        setShowError(true);
                        setIsMatching(false);
                        setEndTime(null);
                        syncStateToStorage({ 
                            isMatching: false, 
                            startTime: null,
                            showError: true,
                            errorMessage: errorMsg
                        });
                        cleanupSSE();
                    });
            }
        };

        matchingEventSource.onerror = (error) => {
            console.error("❌ SSE connection error:", error);
        };

        // Listen to all SSE events and broadcast to other tabs
        const events = ['matchFound', 'matchSuccess', 'matchFailed', 'requeue', 'terminate', 
                        'matchAccepted', 'noQuestion', 'serverError', 'userAdded'];
        
        events.forEach(eventType => {
            matchingEventSource.addEventListener(eventType, (event: any) => {
                const data = event.data ? JSON.parse(event.data) : {};
                console.log(`📨 Lead tab received SSE event: ${eventType}`, data);
                
                // Process event on lead tab
                handleSSEEvent(eventType, data);
                
                // Broadcast to follower tabs
                channelRef.current?.postMessage({
                    type: 'SSE_EVENT',
                    payload: { event: eventType, data, userId, tabId: tabId.current }
                });
            });
        });
    };

    const startMatching = async () => {
        if (!userId || !topic || !difficulty) {
            const errorMsg = 'Please select topic and difficulty';
            setErrorMessage(errorMsg);
            setShowError(true);
            syncStateToStorage({ showError: true, errorMessage: errorMsg });
            return;
        }

        // check if question exists
        let questionExists = true;
        await apiClient.post(`/questions/question/random`, { 
            categories: [topic], 
            difficulty: difficulty 
            })
            .then(() => {
            })
            .catch(error => {
                let errorMsg = "apiClient post error caught while checking question exists";
                if (error.response?.status === 404) {
                    errorMsg = 'No question found for the selected topic and difficulty';
                    console.log(errorMsg);
                }
                questionExists = false;
                setErrorMessage(errorMsg);
                setShowError(true);
                syncStateToStorage({ showError: true, errorMessage: errorMsg });
            });
        if (!questionExists) return;
            


        const stored = getStoredState();
        if (stored.isMatching && stored.userId === userId) {
            console.log('⚠️ Already matching, ignoring duplicate request');
            return;
        }

        // Clear any previous errors
        setShowError(false);
        setIsMatching(true);
        const queueStartTime = Date.now();
        const countdownEndTime = queueStartTime + 60 * 1000; // 🕐 1 minute countdown
        setEndTime(countdownEndTime);

        // Immediately sync to localStorage so all tabs know matching started
        syncStateToStorage({ 
            isMatching: true,
            topic,
            difficulty,
            startTime: queueStartTime,
            endTime: countdownEndTime,
            userId,
            showError: false,
            errorMessage: ''
        });

        // --- FORCE THIS TAB TO BECOME LEAD ---
        const now = Date.now();
        const newLead = { tabId: tabId.current, lastHeartbeat: now };
        localStorage.setItem(LEAD_TAB_KEY, JSON.stringify(newLead));
        setIsLeadTab(true);

        // Broadcast to other tabs that this tab is now lead
        channelRef.current?.postMessage({
            type: 'LEAD_TAKEN',
            payload: { userId, leadTabId: tabId.current }
        });

        console.log('🏆 This tab forcibly became LEAD');

        // Give React state a small moment to update before SSE setup
        setTimeout(async() => {
            console.log('🔗 Setting up SSE as lead tab');
            setupSSE(true); // join queue
        }, 50);
    };

    const acceptMatch = () => {
        if (!userId || !matchId) return;

        apiClient.post(`/matching/matches`, { userId, matchId })
            .then(() => {
                console.log('Match accepted');
            })
            .catch(error => {
                const errorMsg = error.response?.data?.error || "Failed to accept match";
                setErrorMessage(errorMsg);
                setShowError(true);
                syncStateToStorage({ showError: true, errorMessage: errorMsg });
            });
    };

    const stopMatching = () => {
        if (!userId) return;

        const stored = getStoredState();
        if (!stored.isMatching) {
            console.log('⚠️ Not matching, ignoring stop request');
            return;
        }

        console.log('🛑 Stopping matching...');
        setIsMatching(false);
        setEndTime(null);
        setMatchId(null);
        setShowAcceptMatch(false);
        
        // Immediately sync to localStorage
        syncStateToStorage({ 
            isMatching: false, 
            startTime: null,
            endTime: null,
            matchId: null,
            showAcceptMatch: false
        });

        // Clean up SSE and leadership if lead tab
        if (isLeadTab) {
            cleanupSSE();
            localStorage.removeItem(LEAD_TAB_KEY);
            setIsLeadTab(false);
        }

        // Delete from queue via API
        apiClient.delete(`/matching/queue/${userId}`)
            .then(() => {
                console.log('✅ Removed from queue');
            })
            .catch(error => {
                console.error('Failed to remove from queue:', error);
            });
    };

    const resetMatchState = () => {
        console.log('🔄 Resetting all match state...');
        setTopic('');
        setDifficulty('');
        setIsMatching(false);
        setTimer(0);
        setShowError(false);
        setErrorMessage('');
        setShowAcceptMatch(false);
        setMatchFound(false);
        setMatchId(null);
        setEndTime(null);
        
        if (isLeadTab) {
            cleanupSSE();
            localStorage.removeItem(LEAD_TAB_KEY);
            setIsLeadTab(false);
        }
        
        localStorage.removeItem(STORAGE_KEY);
        console.log('✅ Match state cleared');
    };

    // Debug: Expose clear function to window for manual cleanup
    useEffect(() => {
        (window as any).clearMatchingState = () => {
            console.log('🧹 Manual state clear triggered');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEAD_TAB_KEY);
            cleanupSSE();
            setIsLeadTab(false);
            setIsMatching(false);
            setEndTime(null)
            console.log('✅ State cleared. Refresh page to restart.');
        };
        
        return () => {
            delete (window as any).clearMatchingState;
        };
    }, []);

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

export const useMatching = () => {
    const context = useContext(MatchingContext);
    if (!context) throw new Error("useMatching must be used within a MatchingProvider");
    return context;
};