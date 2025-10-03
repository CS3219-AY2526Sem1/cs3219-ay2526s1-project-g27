/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑09‑12
Scope: 
- Generated template code
Author review: 
- Verfied for correctness by reading code

Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑04
Scope: 
- Add field for testing roomID
Author review: 
- Verfied for correctness by running code
*/

import './App.css';
import { useState } from 'react';
import { CollaborativeEditor } from './editor';

function App() {
  const [roomID, setRoomID] = useState('');
  const [connectedRoomID, setConnectedRoomID] = useState<string | null>(null);

  const handleConnect = () => {
    if (roomID.trim()) {
      setConnectedRoomID(roomID.trim());
    }
  };

  return (
    <div className="App">
      <h2>Collaborative CodeMirror Editor</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          placeholder="Enter Room ID"
          style={{ marginRight: '0.5rem', padding: '0.25rem' }}
        />
        <button onClick={handleConnect}>Connect</button>
      </div>

      {connectedRoomID ? (
        <CollaborativeEditor roomID={connectedRoomID} />
      ) : (
        <p>Please enter a Room ID and click Connect.</p>
      )}
    </div>
  );
}

export default App;