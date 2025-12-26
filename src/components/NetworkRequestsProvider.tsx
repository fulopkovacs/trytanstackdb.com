import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Types
export interface NetworkRequest {
  id: string;
  timestamp: number;
  method: "GET" | "PATCH" | "POST" | "DELETE";
  pathname: string;
  requestBody?: unknown;
  responseBody?: unknown;
  status: number;
  duration: number; // ms
}

interface NetworkPanelContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  requests: NetworkRequest[];
  addRequest: (request: NetworkRequest) => void;
  clearRequests: () => void;
}

// Constants
const NETWORK_PANEL_OPEN_KEY = "network_panel_open";
const MAX_REQUESTS = 100;

// Context
const NetworkPanelContext = createContext<NetworkPanelContextValue | null>(
  null,
);

// Custom event type for network request logging
export interface NetworkRequestLoggedEvent extends CustomEvent {
  detail: NetworkRequest;
}

declare global {
  interface WindowEventMap {
    "network-request-logged": NetworkRequestLoggedEvent;
  }
}

// Provider component
export function NetworkRequestsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(NETWORK_PANEL_OPEN_KEY);
    return stored === null ? true : stored === "true";
  });

  const [requests, setRequests] = useState<NetworkRequest[]>([]);

  // Persist isOpen to localStorage
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    localStorage.setItem(NETWORK_PANEL_OPEN_KEY, String(open));
  }, []);

  // Add a new request to the log
  const addRequest = useCallback((request: NetworkRequest) => {
    setRequests((prev) => {
      const newRequests = [...prev, request];
      // Keep only the last MAX_REQUESTS
      if (newRequests.length > MAX_REQUESTS) {
        return newRequests.slice(-MAX_REQUESTS);
      }
      return newRequests;
    });
  }, []);

  // Clear all requests
  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  // Listen for network request events from pgliteHelpers
  const addRequestRef = useRef(addRequest);
  addRequestRef.current = addRequest;

  useEffect(() => {
    const handleNetworkRequest = (event: NetworkRequestLoggedEvent) => {
      addRequestRef.current(event.detail);
    };

    window.addEventListener("network-request-logged", handleNetworkRequest);
    return () => {
      window.removeEventListener(
        "network-request-logged",
        handleNetworkRequest,
      );
    };
  }, []);

  return (
    <NetworkPanelContext.Provider
      value={{
        isOpen,
        setIsOpen,
        requests,
        addRequest,
        clearRequests,
      }}
    >
      {children}
    </NetworkPanelContext.Provider>
  );
}

// Hook to use the context
export function useNetworkPanel() {
  const context = useContext(NetworkPanelContext);
  if (!context) {
    throw new Error(
      "useNetworkPanel must be used within a NetworkRequestsProvider",
    );
  }
  return context;
}
