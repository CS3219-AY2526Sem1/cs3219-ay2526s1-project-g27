/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5)
Scope: 
- Boilerplate code generation 
Author review: 
- Verfied for correctness by reading code
- Verified as working through page display 
*/


import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; 

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold tracking-wider text-primary">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-gray-400">Page Not Found</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Sorry, the page you are looking for does not exist.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link to="/">Go Back to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;