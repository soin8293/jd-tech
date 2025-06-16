
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthDebugProvider } from "@/contexts/AuthDebugContext";
import App from "./App.tsx";
import "./index.css";

// Import Firebase Functions debugger to run diagnostics
import "./utils/firebaseFunctionsDebugger.ts";

// Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthDebugProvider>
        <AuthProvider>
          <Router>
            <App />
          </Router>
        </AuthProvider>
      </AuthDebugProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
