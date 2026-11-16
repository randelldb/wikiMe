import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import App from "./App";
import "./index.css";

const theme = createTheme({
  /** Indigo to stay close to the previous WikiMe accent color. */
  primaryColor: "indigo",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  radius: { xs: "6px", sm: "8px", md: "12px", lg: "16px", xl: "24px" },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
);
