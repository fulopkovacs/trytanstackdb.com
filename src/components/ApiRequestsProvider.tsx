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
export interface ApiRequest {
  id: string;
  timestamp: number;
  method: "GET" | "PATCH" | "POST" | "DELETE";
  pathname: string;
  requestBody?: unknown;
  responseBody?: unknown;
  status: number | "pending";
  duration: number | null; // null when pending
}

interface ApiPanelContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  requests: ApiRequest[];
  addRequest: (request: ApiRequest) => void;
  updateRequest: (
    id: string,
    updates: Partial<Pick<ApiRequest, "responseBody" | "status" | "duration">>,
  ) => void;
  clearRequests: () => void;
}

// Constants
const API_PANEL_OPEN_KEY = "api_panel_open";
const MAX_REQUESTS = 100;

// Context
const ApiPanelContext = createContext<ApiPanelContextValue | null>(null);

// Custom event types for API request logging
export interface ApiRequestStartedEvent extends CustomEvent {
  detail: {
    id: string;
    timestamp: number;
    method: ApiRequest["method"];
    pathname: string;
    requestBody?: unknown;
  };
}

export interface ApiRequestCompletedEvent extends CustomEvent {
  detail: {
    id: string;
    responseBody?: unknown;
    status: number;
    duration: number;
  };
}

declare global {
  interface WindowEventMap {
    "api-request-started": ApiRequestStartedEvent;
    "api-request-completed": ApiRequestCompletedEvent;
  }
}

// Provider component
export function ApiRequestsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(API_PANEL_OPEN_KEY);
    return stored === null ? true : stored === "true";
  });

  const [requests, setRequests] = useState<ApiRequest[]>([]);

  // Persist isOpen to localStorage
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    localStorage.setItem(API_PANEL_OPEN_KEY, String(open));
  }, []);

  // Add a new request to the log
  const addRequest = useCallback((request: ApiRequest) => {
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
        Pick<ApiRequest, "responseBody" | "status" | "duration">
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

  // Listen for API request events from pgliteHelpers
  const addRequestRef = useRef(addRequest);
  const updateRequestRef = useRef(updateRequest);
  addRequestRef.current = addRequest;
  updateRequestRef.current = updateRequest;

  useEffect(() => {
    const handleRequestStarted = (event: ApiRequestStartedEvent) => {
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

    const handleRequestCompleted = (event: ApiRequestCompletedEvent) => {
      const { id, responseBody, status, duration } = event.detail;
      updateRequestRef.current(id, {
        responseBody,
        status,
        duration,
      });
    };

    window.addEventListener("api-request-started", handleRequestStarted);
    window.addEventListener("api-request-completed", handleRequestCompleted);
    return () => {
      window.removeEventListener("api-request-started", handleRequestStarted);
      window.removeEventListener(
        "api-request-completed",
        handleRequestCompleted,
      );
    };
  }, []);

  return (
    <ApiPanelContext.Provider
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
    </ApiPanelContext.Provider>
  );
}

// Hook to use the context
export function useApiPanel() {
  const context = useContext(ApiPanelContext);
  if (!context) {
    throw new Error("useApiPanel must be used within an ApiRequestsProvider");
  }
  return context;
}
