import type { AppProps } from "next/app";
import { ThemeProvider } from "../context/ThemeContext";
import { CodeProvider } from "../context/CodeContext";
import Navbar from "./components/Navbar";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <CodeProvider>
        <div className="min-h-screen">
          <Navbar />
          <Component {...pageProps} />
        </div>
      </CodeProvider>
    </ThemeProvider>
  );
}

export default MyApp;
