/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑09‑12
Scope: 
- Generated template code
Author review: 
- Verfied for correctness by reading code

AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑04
Scope: 
- Generated code to send a request for different rooms
Author review: 
- Verfied for correctness by running code
*/

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import React, { useState, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';

import { yCollab } from 'y-codemirror.next';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import * as random from 'lib0/random';
import { Compartment } from '@codemirror/state';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const WEBSOCKET_ENDPOINT = `ws://localhost/api/collab/room`;


export const USERCOLOURS = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' }
]

export const userColour = USERCOLOURS[random.uint32() % USERCOLOURS.length]

interface CollaborativeEditorProps {
  matchToken: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ matchToken })  => {
  const editorRef = useRef<HTMLDivElement>(null);
  const ydocRef = useRef<Y.Doc>(null);
  const providerRef = useRef<WebsocketProvider>(null);
  const editorViewRef = useRef<EditorView>(null);
  const editableCompartment = useRef(new Compartment());
  const [ matchState, setMatchState ] = useState<boolean>(true);
  const [ partnerState, setPartnerState ] = useState<boolean>(true);
  const [ partnerLiveliness, setPartnerLiveliness ] = useState<boolean>(true);
  const [ language, setLanguage ] = useState<"python3" | "cpp" | "javascript">("javascript");

  const { user, jwt }= useAuth();

  const TIMEOUT_DELAY = 3000;
  const timeoutRef = useRef<NodeJS.Timeout|null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'shortDisconnect' | 'connected'>('connected');

  const handleWebsocketStatusChange = ( status : "connected" | "disconnected" | "connecting") => {
    console.log(`Status changed to ${status}`)
    if (status == "connected" && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setConnectionStatus("connected");
    }
    if (status == "disconnected" || status == "connecting") {
      if (connectionStatus == "shortDisconnect" || connectionStatus == "disconnected") {
        return;
      }
      setConnectionStatus("shortDisconnect");
      if (timeoutRef.current) {
        return;
      }
      timeoutRef.current = setTimeout(() => {
        console.log("Long disconnect, freezing editting")
        setConnectionStatus('disconnected');
      }, TIMEOUT_DELAY);
    }
  };
  const handleLanguageChange = (value: "python3" | "cpp" | "javascript") => {
    setLanguage(value);
  };

  useEffect(() => { 
    if (!user || !jwt) {
      console.log("No Auth token");
      return;
    }

    {/* Language Linting */}
    let languageLintExtension = javascript;
    switch(language) {
      case "python3": {
        languageLintExtension = python;
        break;
      }
      case "javascript": {
        languageLintExtension = javascript;
        break;
      }
      case "cpp": {
        languageLintExtension = cpp;
        break;
      }
      default: {
        languageLintExtension = javascript;
      }
    }
    
    const ydoc = new Y.Doc();
    // console.log(`Connecting to ${WEBSOCKET_ENDPOINT}/${matchToken}?userId=${user.id}?token:${jwt}`)
    // console.log(`token: ${jwt}`)
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, matchToken, ydoc, {params: {userId: user.id || 'Anonymous ' + Math.floor(Math.random() * 100), token: jwt}});
    
    provider.ws?.addEventListener('close', event => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (event.code == 3000) { // Match ended
        console.log("Match no longer in progress"); 
        localStorage.removeItem("matchToken");
        setMatchState(false);
        provider.destroy();
        ydoc.destroy();
        view.destroy();
      }
    });

    provider.ws?.addEventListener('message', (event) => {
      if (!(typeof event.data === "string")){
        return;
      }
      switch (event.data) {
        // Partner rejoins
        case ('partnerRejoin'): {
          console.log('Your partner has rejoined');
          setPartnerState(true);
          return;
        }
        // Last user
        case ('lastUser'): {
          console.log('You are the last user');
          setPartnerState(false);
          return;
        }
        // Partner afk
        case ('partnerAfk'): {
          console.log('Your partner is afk');
          setPartnerLiveliness(false);
          return;
        }
        case ('partnerAlive'): {
          console.log('Your partner is alive');
          setPartnerLiveliness(true);
          return;
        }
        default: {
          return;
        }
      }
    });
    
    provider.on('status', (event) => {
      handleWebsocketStatusChange(event.status);
    });

    provider.awareness.setLocalStateField('user', {
      name: user.username,
      color: userColour.color,
      colorLight: userColour.light
    });
    const yText = ydoc.getText('codemirror');
    

    const view = new EditorView({
      doc: yText.toString(),
      extensions: [
        keymap.of(defaultKeymap),
        basicSetup,
        languageLintExtension(),
        EditorView.lineWrapping,
        yCollab(yText, provider.awareness),
        editableCompartment.current.of(EditorView.editable.of(connectionStatus === 'connected'))
      ],
      parent: editorRef.current!,
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;
    editorViewRef.current = view;

    return () => {
      provider.destroy();
      if (!partnerState) {
        console.log("Terminating match");
        localStorage.removeItem("matchToken");
      }
      ydoc.destroy();
      view.destroy();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [matchToken, language, user, jwt]);
  
  useEffect( () => { // Handle disconnects
    // Dispatch readonly
    if (editorViewRef.current && editableCompartment.current) {
      editorViewRef.current.dispatch({
        effects: editableCompartment.current.reconfigure(
          EditorView.editable.of(connectionStatus != 'disconnected' && matchState)
        )
      });
    }
  }, [connectionStatus, matchState]);

  {/* Status Logic */}
  let myStatusColor = 'bg-gray-400';
  let myStatusText = 'Unknown';
  switch (connectionStatus) {
    case 'connected':
      myStatusColor = 'bg-green-600';
      myStatusText = 'Connected';
      break;
    case 'shortDisconnect':
      myStatusColor = 'bg-yellow-600';
      myStatusText = 'Reconnecting...';
      break;
    case 'disconnected':
      myStatusColor = 'bg-red-600';
      myStatusText = 'Disconnected';
      break;
  }

  let partnerStatusColor = 'bg-gray-400';
  let partnerStatusText = 'Unknown';
  if (!matchState) {
    partnerStatusColor = 'bg-red-700';
    partnerStatusText = 'Match Does Not Exist';
  } else if (!partnerState) {
    partnerStatusColor = 'bg-red-600';
    partnerStatusText = 'Left Page';
  } else if (partnerState && !partnerLiveliness) {
    partnerStatusColor = 'bg-yellow-600';
    partnerStatusText = 'AFK';
  } else if (partnerState && partnerLiveliness) {
    partnerStatusColor = 'bg-green-600';
    partnerStatusText = 'Active';
  }
  
  return (
    <div className="w-full">
      {/* Header section with controls and status */}
      <div className="flex justify-between items-start mb-2">

        {/* Left Side: Language Selector */}
        <div className="flex-end gap-2">
          <label
            htmlFor="language-select"
            className="text-sm font-medium text-gray-700"
          >
            Language
          </label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select" className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="python3">Python 3</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="javascript">Javascript</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right Side: Status Messages */}
        <div className="text-right text-sm space-y-1.5">
          {/* My Status Row */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-gray-700">You:</span>
            <span className={`w-3 h-3 rounded-full ${myStatusColor}`}></span>
            <span className="text-sm text-gray-900">({myStatusText})</span>
          </div>
          {/* Partner Status Row */}
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-gray-700">Partner:</span>
            <span className={`w-3 h-3 rounded-full ${partnerStatusColor}`}></span>
            <span className="text-sm text-gray-900">({partnerStatusText})</span>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div ref={editorRef} className="border border-[#ccc] h-[400px] rounded-md"/>
    </div>
  )
};
