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


export default function CollaborationPage() {

    const matchToken = localStorage.getItem('matchToken');
    const [language, setLanguage] = useState<"python3" | "cpp" | "javascript">("javascript");

    if (!matchToken) {
        return <div><p> ERROR! Did not receive a Match Token</p></div>
    }
    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(event.target.value as "python3" | "cpp" | "javascript");
    };

    return (
        <div className="flex h-screen">
            {/* ADD THE QUESTION ON THE SIDE*/}
            <div className="flex-1 border-r border-gray-300 p-6">
                <h2 className="text-xl font-semibold mb-4">Info Panel</h2>
                <p>Details about the match, instructions, or chat here.</p>
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
        </div>
    );
}