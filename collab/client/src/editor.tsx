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
import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { yCollab } from 'y-codemirror.next';

const WEBSOCKET_ENDPOINT = 'ws://localhost:1234';

export const CollaborativeEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const ydocRef = useRef<Y.Doc>();
  const providerRef = useRef<WebsocketProvider>();
  const editorViewRef = useRef<EditorView>();

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, 'my-room-id', ydoc);

    const yText = ydoc.getText('codemirror');

    const view = new EditorView({
      doc: yText.toString(),
      extensions: [
        basicSetup,
        javascript(),
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
