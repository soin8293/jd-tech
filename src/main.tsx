
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("🔥 MAIN: Starting main.tsx at:", new Date().toISOString());
console.log("🔥 MAIN: About to render App component");

createRoot(document.getElementById("root")!).render(<App />);

console.log("🔥 MAIN: App component render call completed");
