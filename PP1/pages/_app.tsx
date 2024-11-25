import type { AppProps } from "next/app";
import { ThemeProvider } from "../context/ThemeContext";
import { CodeProvider } from "../context/CodeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "../styles/globals.css";
import { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return;

        const response = await fetch('/api/user/refresh', {
          method: 'POST',
          headers: {
            'Authorization': refreshToken,
          },
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("accessToken", `Bearer ${data.accessToken}`);
          localStorage.setItem("refreshToken", `Bearer ${data.refreshToken}`);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    };

    // Initial refresh
    refreshToken();

    // Set up interval (30 minutes = 600000 milliseconds)
    const intervalId = setInterval(refreshToken, 180000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <CodeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </CodeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MyApp;
