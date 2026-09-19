import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../src/index.css"
import PreviewApp from "./PreviewApp"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreviewApp />
  </StrictMode>,
)
