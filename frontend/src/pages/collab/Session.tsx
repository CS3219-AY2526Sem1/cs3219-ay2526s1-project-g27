/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑16
Scope: 
- Generated template HTMl for structure
Author review: 
- Verfied for correctness by reading code
*/

import { CollaborativeEditor } from '@/components/collab/Editor';
import FloatingChat from '@/components/chat/Chat'

export default function CollaborationPage() {

  const matchToken = localStorage.getItem('matchToken');
  const question = JSON.parse(localStorage.getItem("question") || "{}");

  if (!matchToken) {
      return <div><p> ERROR! Did not receive a Match Token</p></div>
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 border-r border-gray-300 p-6 overflow-y-auto">
        <h1 className="text-xl font-semibold mb-4">Question</h1>
        {question ? (
          <div>
            <h3 className="text-lg font-bold mb-2">{question.QuestionTitle}</h3>
            <p className="text-gray-700 mb-4">{question.QuestionDescription}</p>
            <div className="text-sm text-gray-600 mb-2">
              <b>Difficulty:</b> {question.QuestionComplexity}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <b>Categories:</b>{" "}
              {question.QuestionCategories?.join(", ")}
            </div>
            <div className="text-sm text-gray-600">
              <b>Score:</b> {question.questionScore}
            </div>
          </div>
          ) : (
          <p>Loading question...</p>
        )}
      </div>

      {/* Collab col */}
      <div className="flex-2 p-6">
        <CollaborativeEditor matchToken={matchToken}/>
      </div>
      <FloatingChat matchToken={matchToken}/>
    </div>
  );
}