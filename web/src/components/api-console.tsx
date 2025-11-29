"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { rawApiCall } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { Terminal, Send, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  status: number;
  time: number;
  response: unknown;
}

export function ApiConsole() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/health");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await rawApiCall(method, endpoint, body || undefined);
      const entry: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        method,
        endpoint,
        status: result.status,
        time: result.time,
        response: result.data,
      };
      setLogs((prev) => [entry, ...prev]);
    } catch (error) {
      const entry: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        method,
        endpoint,
        status: 0,
        time: 0,
        response: error instanceof Error ? error.message : "Unknown error",
      };
      setLogs((prev) => [entry, ...prev]);
    }
    setLoading(false);
  };

  const clearLogs = () => setLogs([]);

  const quickEndpoints = [
    { method: "GET", endpoint: "/health", label: "Health" },
    { method: "GET", endpoint: "/stops", label: "Stops" },
    { method: "GET", endpoint: "/stops/nearest?lat=40.7128&lon=-74.006", label: "Nearest" },
    { method: "GET", endpoint: "/route?from=40.7128,-74.006&to=40.7580,-73.9855", label: "Route" },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-lg">API Console</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {API_BASE_URL}
          </Badge>
        </div>
        <CardDescription>Test API endpoints directly</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickEndpoints.map((ep) => (
            <Button
              key={ep.endpoint}
              variant="outline"
              size="sm"
              onClick={() => {
                setMethod(ep.method);
                setEndpoint(ep.endpoint);
              }}
            >
              {ep.label}
            </Button>
          ))}
        </div>

        <Separator />

        {/* Request Builder */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm font-mono"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/endpoint"
              className="font-mono"
            />
            <Button onClick={handleSubmit} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {(method === "POST" || method === "PUT") && (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full h-20 px-3 py-2 rounded-md border bg-background font-mono text-sm resize-none"
            />
          )}
        </div>

        <Separator />

        {/* Response Logs */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Response Log</span>
          <Button variant="ghost" size="sm" onClick={clearLogs}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-2 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No requests yet. Try hitting an endpoint!
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-md bg-muted/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.status >= 200 && log.status < 300 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge
                        variant={
                          log.status >= 200 && log.status < 300
                            ? "default"
                            : "destructive"
                        }
                      >
                        {log.status || "ERR"}
                      </Badge>
                      <span className="font-mono text-sm">
                        {log.method} {log.endpoint}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      {log.time}ms
                    </div>
                  </div>
                  <pre className="text-xs font-mono bg-background p-2 rounded overflow-x-auto max-h-40">
                    {typeof log.response === "string"
                      ? log.response
                      : JSON.stringify(log.response, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
