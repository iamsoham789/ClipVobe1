
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Get the root element and create a React root
const rootElement = document.getElementById("root");

// Safely render the app with error boundaries
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Failed to render application:", error);
    
    // Show a fallback UI if rendering fails
    rootElement.innerHTML = '<div style="font-family: sans-serif; padding: 20px; text-align: center;"><h2>Application Error</h2><p>There was a problem starting the application.</p></div>';
  }
} else {
  console.error("Root element not found");
}
