/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑16
Scope: 
- Generated template HTMl for structure
Author review: 
- Verfied for correctness by reading code
*/


import { CollaborativeEditor } from '@/components/collab/editor';
import { useSearchParams } from 'react-router-dom';

export default function CollaborationPage() {
    const [searchParams] = useSearchParams();
    const matchToken = searchParams.get('match');
    const userId = searchParams.get('user');


    if (!matchToken) {
        return <div><p> ERROR! Did not receive a Match Token</p></div>
    }
    return (
        
        <div className="flex h-screen">
            {/* ADD THE QUESTION ON THE SIDE*/}
            <div className="flex-1 border-r border-gray-300 p-6">
                <h2 className="text-xl font-semibold mb-4">Info Panel</h2>
                <p>Details about the match, instructions, or chat here.</p>
            </div>

            {/* Collab col */}
            <div className="flex-2 p-6">
                <CollaborativeEditor matchJwt={matchToken} userId={userId} />
            </div>
        </div>
    )
}