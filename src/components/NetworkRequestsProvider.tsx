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
  status: number | "pending";
  duration: number | null; // null when pending
}

interface NetworkPanelContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  requests: NetworkRequest[];
  addRequest: (request: NetworkRequest) => void;
  updateRequest: (
    id: string,
    updates: Partial<
      Pick<NetworkRequest, "responseBody" | "status" | "duration">
    >,
  ) => void;
  clearRequests: () => void;
}

// Constants
const NETWORK_PANEL_OPEN_KEY = "network_panel_open";
const MAX_REQUESTS = 100;

// Context
const NetworkPanelContext = createContext<NetworkPanelContextValue | null>(
  null,
);

// Custom event types for network request logging
export interface NetworkRequestStartedEvent extends CustomEvent {
  detail: {
    id: string;
    timestamp: number;
    method: NetworkRequest["method"];
    pathname: string;
    requestBody?: unknown;
  };
}

export interface NetworkRequestCompletedEvent extends CustomEvent {
  detail: {
    id: string;
    responseBody?: unknown;
    status: number;
    duration: number;
  };
}

declare global {
  interface WindowEventMap {
    "network-request-started": NetworkRequestStartedEvent;
    "network-request-completed": NetworkRequestCompletedEvent;
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

  // Update an existing request (e.g., when it completes)
  const updateRequest = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<NetworkRequest, "responseBody" | "status" | "duration">
      >,
    ) => {
      setRequests((prev) =>
        prev.map((req) => (req.id === id ? { ...req, ...updates } : req)),
      );
    },
    [],
  );

  // Clear all requests
  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  // Listen for network request events from pgliteHelpers
  const addRequestRef = useRef(addRequest);
  const updateRequestRef = useRef(updateRequest);
  addRequestRef.current = addRequest;
  updateRequestRef.current = updateRequest;

  useEffect(() => {
    const handleRequestStarted = (event: NetworkRequestStartedEvent) => {
      const { id, timestamp, method, pathname, requestBody } = event.detail;
      addRequestRef.current({
        id,
        timestamp,
        method,
        pathname,
        requestBody,
        status: "pending",
        duration: null,
      });
    };

    const handleRequestCompleted = (event: NetworkRequestCompletedEvent) => {
      const { id, responseBody, status, duration } = event.detail;
      updateRequestRef.current(id, {
        responseBody,
        status,
        duration,
      });
    };

    window.addEventListener("network-request-started", handleRequestStarted);
    window.addEventListener(
      "network-request-completed",
      handleRequestCompleted,
    );
    return () => {
      window.removeEventListener(
        "network-request-started",
        handleRequestStarted,
      );
      window.removeEventListener(
        "network-request-completed",
        handleRequestCompleted,
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
        updateRequest,
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
