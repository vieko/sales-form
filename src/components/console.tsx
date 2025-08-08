'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2 } from 'lucide-react'
import { logger, LogEntry, LogLevel } from '@/lib/logger'

const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case 'info':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    case 'warn':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    case 'error':
      return 'bg-red-500/10 text-red-600 border-red-500/20'
    case 'success':
      return 'bg-green-500/10 text-green-600 border-green-500/20'
  }
}

export function Console() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    // Subscribe to client-side logs
    setLogs(logger.getLogs())
    const unsubscribe = logger.subscribe(setLogs)

    // Set up Server-Sent Events for real-time server logs
    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource('/api/console/stream')

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'initial':
            case 'update':
              if (data.logs) {
                setLogs((prevLogs) => {
                  // Merge server logs with client logs, avoiding duplicates
                  const existingIds = new Set(prevLogs.map((log) => log.id))
                  const newLogs = data.logs
                    .filter((log: LogEntry) => !existingIds.has(log.id))
                    .map((log: LogEntry) => ({
                      ...log,
                      // Convert timestamp string back to Date object
                      timestamp: new Date(log.timestamp),
                    }))
                  return [...newLogs, ...prevLogs]
                })
              }
              break
            case 'heartbeat':
              // Keep connection alive, no action needed
              break
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        // Automatically reconnect after 5 seconds
        setTimeout(() => {
          if (eventSource?.readyState === EventSource.CLOSED) {
            eventSource.close()
            // Restart connection by triggering useEffect
            setLogs((prev) => [...prev])
          }
        }, 5000)
      }

      eventSource.onopen = () => {
        console.log('SSE connection established')
      }
    } catch (error) {
      console.error('Failed to establish SSE connection:', error)
    }

    return () => {
      unsubscribe()
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  const formatTime = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-shrink-0 flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground/40 font-mono text-xs font-medium">
          console
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logger.clear()}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full max-h-[80vh]">
          <div className="space-y-4 p-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground/40 pl-2 text-xs">
                waiting for logs...
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="border-muted-foreground/20 border-l-2 pl-2 font-mono text-xs"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {formatTime(log.timestamp)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`${getLevelColor(log.level)} px-1 py-0 text-xs`}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-1">{log.message}</p>
                  {log.data !== undefined && (
                    <pre className="text-muted-foreground/60 bg-muted/50 overflow-x-auto rounded p-2 text-xs">
                      {String(JSON.stringify(log.data, null, 2) || 'undefined')}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
