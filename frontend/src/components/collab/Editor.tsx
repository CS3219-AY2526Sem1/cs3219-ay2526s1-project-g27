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
import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { yCollab } from 'y-codemirror.next';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import * as random from 'lib0/random';
import { useAuth } from '@/context/AuthContext';

// const COLLAB_HOST = import.meta.env.COLLAB_HOST ?? 'ws://localhost';
// const COLLAB_PORT = import.meta.env.COLLAB_PORT ?? '8081';
// const WEBSOCKET_ENDPOINT = `${COLLAB_HOST}:${COLLAB_PORT}`;
const WEBSOCKET_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT ?? 'ws://localhost/api/collab';



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
  userId: string | null;
  // Add user JWT auth token later
}



export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({userId })  => {
  const editorRef = useRef<HTMLDivElement>(null);
  const ydocRef = useRef<Y.Doc>(null);
  const providerRef = useRef<WebsocketProvider>(null);
  const editorViewRef = useRef<EditorView>(null);
  const { jwt: userAuthToken} = useAuth();

  useEffect(() => {
    if (!userAuthToken) {
      console.error('No user auth token available for CollaborativeEditor');
      return;
    }

    const ydoc = new Y.Doc();
    // Might want to extract roomID from JWT instead of using JWT as roomID
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, userAuthToken, ydoc, {params: {userId: userId || 'Anonymous ' + Math.floor(Math.random() * 100), token: userAuthToken}});
    provider.ws?.addEventListener('close', event => {
      console.log('WebSocket closed:', event.code, event.reason);
    });
    
    provider.awareness.setLocalStateField('user', {
      name: userId,
      color: userColour.color,
      colorLight: userColour.light
    });
    const yText = ydoc.getText('codemirror');

    const view = new EditorView({
      doc: yText.toString(),
      extensions: [
        keymap.of(defaultKeymap),
        basicSetup,
        javascript(),
        EditorView.lineWrapping,
        yCollab(yText, provider.awareness),
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
  }, [userAuthToken]);

  return <div ref={editorRef} style={{ border: '1px solid #ccc', height: '400px' }} />;
};
