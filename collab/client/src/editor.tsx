/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑09‑12
Scope: 
- Generated template code
Author review: 
- Verfied for correctness by reading code
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


const WEBSOCKET_ENDPOINT = 'ws://localhost:1234';

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

export const CollaborativeEditor:React.FC = ()  => {
  const editorRef = useRef<HTMLDivElement>(null);
  const ydocRef = useRef<Y.Doc>(null);
  const providerRef = useRef<WebsocketProvider>(null);
  const editorViewRef = useRef<EditorView>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, 'my-room-id', ydoc);
    provider.awareness.setLocalStateField('user', {
      name: 'Anonymous ' + Math.floor(Math.random() * 100),
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
  }, []);

  return <div ref={editorRef} style={{ border: '1px solid #ccc', height: '400px' }} />;
};
