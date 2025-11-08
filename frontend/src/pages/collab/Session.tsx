/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑16
Scope: 
- Generated template HTMl for structure
Author review: 
- Verfied for correctness by reading code
*/

import { useState } from "react";

import { CollaborativeEditor } from '@/components/collab/Editor';
import FloatingChat from '@/components/chat/Chat'

export default function CollaborationPage() {

    const matchToken = localStorage.getItem('matchToken');
    const question = JSON.parse(localStorage.getItem("question") || "{}");
    const [language, setLanguage] = useState<"python3" | "cpp" | "javascript">("python3");

    if (!matchToken) {
        return <div><p> ERROR! Did not receive a Match Token</p></div>
    }
    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value as "python3" | "cpp" | "javascript");
    };

    console.log("Question in Session.tsx:", question);
    return (
        <div className="flex h-screen">
            {/* ADD THE QUESTION ON THE SIDE*/}
            <div className="flex-1 border-r border-gray-300 p-6">
                <h2 className="text-xl font-semibold mb-4">Question Panel</h2>
                <div className="flex-1 border-r border-gray-300 p-6 overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Question</h2>
                    {question ? (
                    <div>
                        <h3 className="text-lg font-bold mb-2">{question.QuestionTitle}</h3>
                        <p className="text-gray-700 mb-4">{question.QuestionDescription}</p>
                        <div className="text-sm text-gray-600 mb-2">
                        <strong>Difficulty:</strong> {question.QuestionComplexity}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                        <strong>Categories:</strong>{" "}
                        {question.QuestionCategories?.join(", ")}
                        </div>
                        <div className="text-sm text-gray-600">
                        <strong>Score:</strong> {question.questionScore}
                        </div>
                    </div>
                    ) : (
                    <p>Loading question...</p>
                    )}
                </div>
            </div>

            {/* Collab col */}
            <div className="flex-2 p-6">
                <CollaborativeEditor matchToken={matchToken} language={language}/>
            </div>
            <select id="dropdown" value={language} onChange={handleLanguageChange}>
                <option value="">--Please choose--</option>
                <option value="python3">Python 3</option>
                <option value="cpp">C++</option>
                <option value="javascript">Javascript</option>
            </select>
            <FloatingChat matchToken={matchToken}/>
        </div>
    );
}