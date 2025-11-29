"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { checkHealth } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { Wifi, WifiOff, Bus } from "lucide-react";

export function Header() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await checkHealth();
        setBackendStatus("online");
      } catch {
        setBackendStatus("offline");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Bus className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Transit Dev Dashboard</h1>
        </div>
        <Badge variant="outline" className="hidden sm:flex">
          Development
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {API_BASE_URL}
          </span>
          <Badge
            variant={backendStatus === "online" ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {backendStatus === "online" ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Backend Online</span>
                <span className="sm:hidden">Online</span>
              </>
            ) : backendStatus === "offline" ? (
              <>
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">Backend Offline</span>
                <span className="sm:hidden">Offline</span>
              </>
            ) : (
              <>
                <div className="h-3 w-3 animate-pulse rounded-full bg-current" />
                <span>Checking...</span>
              </>
            )}
          </Badge>
        </div>
      </div>
    </header>
  );
}
