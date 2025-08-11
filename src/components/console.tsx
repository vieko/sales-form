'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2 } from 'lucide-react'
import { LogEntry, LogLevel } from '@/lib/logger'
import { getLogs, clearLogs } from '@/actions/logging'

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
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Initialize session ID
  useEffect(() => {
    const id = sessionStorage.getItem('sessionId') || 
      (() => {
        const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('sessionId', newId)
        return newId
      })()
    setSessionId(id)
  }, [])

  // Fetch logs using server action
  const fetchLogs = useCallback(async () => {
    if (!sessionId) return
    
    try {
      const logs = await getLogs(sessionId)
      setLogs(logs)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }, [sessionId])

  // Poll for logs
  useEffect(() => {
    if (!sessionId) return
    
    // Initial fetch
    fetchLogs()
    
    // Set up polling every 2 seconds
    const interval = setInterval(fetchLogs, 2000)
    
    return () => clearInterval(interval)
  }, [sessionId, fetchLogs])

  // Clear logs using server action
  const clearLogsHandler = useCallback(async () => {
    if (!sessionId) return
    
    try {
      const result = await clearLogs(sessionId)
      if (result.success) {
        setLogs([])
      } else {
        console.error('Failed to clear logs:', result.error)
      }
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }, [sessionId])

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
          onClick={clearLogsHandler}
          className="h-8 w-8 p-0"
          disabled={!sessionId}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full max-h-[80vh]">
          <div className="space-y-4 p-4">
            {logs.length === 0 ? (
              <div className="text-muted-foreground/30 pl-2 text-xs italic">
                console ready
              </div>
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
                  {log.data !== undefined && log.data !== null && (
                    <pre className="text-muted-foreground/60 bg-muted/50 overflow-x-auto rounded p-2 text-xs">
                      {String(JSON.stringify(log.data, null, 2))}
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
