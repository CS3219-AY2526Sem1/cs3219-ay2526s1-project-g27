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
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isLeadTab, setIsLeadTab] = useState(false);

    const { user, jwt } = useAuth(); 
    const userId = user?.id;
    const navigate = useNavigate();

    const tabId = useRef(`tab-${Date.now()}-${Math.random()}`);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const isInitialized = useRef(false);
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
            setStartTime(stored.startTime);
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
        if (isInitialized.current || !userId) return;
        isInitialized.current = true;

        // CLEAR OLD STALE DATA ON FIRST LOAD
        const storedState = getStoredState();
        
        // Clear if data is from a different user
        if (storedState.userId && storedState.userId !== userId) {
            console.log('🧹 Clearing stale state from different user');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEAD_TAB_KEY);
            return;
        }

        // Clear if matching state is stale (older than 5 minutes)
        if (storedState.startTime && Date.now() - storedState.startTime > 5 * 60 * 1000) {
            console.log('🧹 Clearing stale matching state (>5 min old)');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEAD_TAB_KEY);
            return;
        }
        
        if (storedState.isMatching && storedState.userId === userId) {
            console.log('🔄 Restoring queue state from storage');
            loadStateFromStorage();

            // Try to become lead and setup SSE if successful
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

    // Timer effect - runs on ALL tabs, synced via startTime from localStorage
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isMatching && startTime) {
            const updateTimer = () => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setTimer(elapsed);
            };
            
            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            setTimer(0);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isMatching, startTime]);

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
                setStartTime(null);
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
                setStartTime(null);
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
                setStartTime(null);
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

    const setupSSE = (shouldAddToQueue: boolean) => {
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
                        setStartTime(null);
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

    const startMatching = () => {
        if (!userId || !topic || !difficulty) {
            const errorMsg = 'Please select topic and difficulty';
            setErrorMessage(errorMsg);
            setShowError(true);
            syncStateToStorage({ showError: true, errorMessage: errorMsg });
            return;
        }

        const stored = getStoredState();
        if (stored.isMatching && stored.userId === userId) {
            console.log('⚠️ Already matching, ignoring duplicate request');
            return;
        }

        // Clear any previous errors
        setShowError(false);
        setIsMatching(true);
        const queueStartTime = Date.now();
        setStartTime(queueStartTime);

        // Immediately sync to localStorage so all tabs know matching started
        syncStateToStorage({ 
            isMatching: true,
            topic,
            difficulty,
            startTime: queueStartTime,
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
        setTimeout(() => {
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
        setStartTime(null);
        setMatchId(null);
        setShowAcceptMatch(false);
        
        // Immediately sync to localStorage
        syncStateToStorage({ 
            isMatching: false, 
            startTime: null,
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
        setStartTime(null);
        
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
            setStartTime(null);
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
