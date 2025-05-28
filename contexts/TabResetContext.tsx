// contexts/TabResetContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Define the type for the reset functions
type ResetFunction = () => void;

// Define the context type
interface TabResetContextType {
  registerResetFunction: (tabName: string, resetFunction: ResetFunction) => void;
  resetTab: (tabName: string) => void;
  lastTabName: string | null;
  setLastTabName: (tabName: string | null) => void;
}

// Create the context with a default value
const TabResetContext = createContext<TabResetContextType>({
  registerResetFunction: () => {},
  resetTab: () => {},
  lastTabName: null,
  setLastTabName: () => {},
});

// Create a hook to use the context
export const useTabReset = () => useContext(TabResetContext);

// Create the provider component
export const TabResetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store reset functions for each tab
  const resetFunctions = useRef<Record<string, ResetFunction>>({});
  
  // Track the last tab that was active
  const [lastTabName, setLastTabName] = useState<string | null>(null);

  // Register a reset function for a tab
  const registerResetFunction = useCallback((tabName: string, resetFunction: ResetFunction) => {
    resetFunctions.current[tabName] = resetFunction;
  }, []);

  // Reset a tab
  const resetTab = useCallback((tabName: string) => {
    const resetFunction = resetFunctions.current[tabName];
    if (resetFunction) {
      resetFunction();
    }
  }, []);

  // Provide the context value
  const contextValue: TabResetContextType = {
    registerResetFunction,
    resetTab,
    lastTabName,
    setLastTabName,
  };

  return (
    <TabResetContext.Provider value={contextValue}>
      {children}
    </TabResetContext.Provider>
  );
};