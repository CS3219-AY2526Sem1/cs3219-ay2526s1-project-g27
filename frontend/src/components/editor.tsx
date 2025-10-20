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

// im trying to allow the user to disconnect and reconnect. During the disconnect, the user must not be able to edit the document

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

const COLLAB_HOST = import.meta.env.COLLAB_HOST || 'ws://localhost';
const COLLAB_PORT = import.meta.env.COLLAB_PORT || '8081';
const WEBSOCKET_ENDPOINT = `${COLLAB_HOST}:${COLLAB_PORT}/room`;


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
  language: "python3" | "cpp" | "javascript";
  // Add user JWT auth token later
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ matchToken })  => {
  const editorRef = useRef<HTMLDivElement>(null);
  const ydocRef = useRef<Y.Doc>(null);
  const providerRef = useRef<WebsocketProvider>(null);
  const editorViewRef = useRef<EditorView>(null);
  const editableCompartment = useRef(new Compartment());
  const [language, setLanguage] = useState<string>('python3');

  const { user }= useAuth();
  if (!user) {
    console.log("No AUth token");
    return;
  }
  const TIMEOUT_DELAY = 3000;
  const timeoutRef = useRef<NodeJS.Timeout|null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'shortDisconnect' | 'connected'>('connected');

  const handleWebsocketStatusChange = ( status : "connected" | "disconnected" | "connecting") => {
    console.log(`Status changed to ${status}`)
    if (status == "connected" && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setConnectionStatus("connected");
    }
    if (status == "disconnected") {
      setConnectionStatus("shortDisconnect");
      timeoutRef.current = setTimeout(() => {
        console.log("Long disconnect, freezing editting")
        setConnectionStatus('disconnected');
      }, TIMEOUT_DELAY);
    }
  };

  useEffect(() => { //Handle language change
    var languageLintExtension = javascript;

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
    console.log(`Connecting to ${WEBSOCKET_ENDPOINT}/${matchToken}?userId=${user.id}`)
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, matchToken, ydoc, {params: {userId: user.id || 'Anonymous ' + Math.floor(Math.random() * 100)}});
    
    provider.ws?.addEventListener('close', event => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (event.reason == "Match Ended" && event.code == 3000) {
        localStorage.removeItem("matchToken");
      }
    });

    // Last user
    provider.ws?.addEventListener('lastUser', event => {
      console.log('You are the last user');
    });

    // Match ended
    provider.ws?.addEventListener('end', event => {
      console.log('You are the last user');
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
      ydoc.destroy();
      view.destroy();
    };
  }, [matchToken, language]);
  
  useEffect( () => { // Handle disconnects
    // Dispatch readonly
    if (editorViewRef.current && editableCompartment.current) {
      editorViewRef.current.dispatch({
        effects: editableCompartment.current.reconfigure(
          EditorView.editable.of(connectionStatus != 'disconnected')
        )
      });
    }
  }, [connectionStatus]);
  
  return (
    <>
      {connectionStatus === "shortDisconnect" && <div>'Connecting...'</div>}
      {connectionStatus === "disconnected" && <div>'Disconnected'</div>}
      <div ref={editorRef} style={{ border: '1px solid #ccc', height: '400px' }} />;
    </>
  )
};
