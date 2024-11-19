import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the context
interface CodeContextType {
  code: string;
  setCode: (code: string) => void;
}

// Create the context with a default value
const CodeContext = createContext<CodeContextType | undefined>(undefined);

// Create the provider
interface CodeProviderProps {
  children: ReactNode;
}

export const CodeProvider: React.FC<CodeProviderProps> = ({ children }) => {
  const [code, setCode] = useState<string>(""); // State to store the code

  return (
    <CodeContext.Provider value={{ code, setCode }}>
      {children}
    </CodeContext.Provider>
  );
};

// Custom hook to use the context
export const useCode = (): CodeContextType => {
  const context = useContext(CodeContext);
  if (!context) {
    throw new Error("useCode must be used within a CodeProvider");
  }
  return context;
};
