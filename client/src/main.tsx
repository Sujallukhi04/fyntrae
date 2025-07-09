import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { AuthProvider } from "./providers/AuthProvider.tsx";
import { OrganizationProvider } from "./providers/OrganizationProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <App />
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
