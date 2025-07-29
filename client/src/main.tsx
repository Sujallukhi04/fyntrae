import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { AuthProvider } from "./providers/AuthProvider.tsx";
import { OrganizationProvider } from "./providers/OrganizationProvider.tsx";
import { OrgAccessProvider } from "./providers/OrgAccessProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <OrgAccessProvider>
            <App />
          </OrgAccessProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
