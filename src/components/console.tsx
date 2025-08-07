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
    setLogs(logger.getLogs())
    const unsubscribe = logger.subscribe(setLogs)
    return unsubscribe
  }, [])

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Console</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logger.clear()}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="space-y-1 p-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs yet...</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="border-muted-foreground/20 border-l-2 pl-2 text-xs font-mono"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {formatTime(log.timestamp)}
                    </span>
                    <Badge
                      variant="outline"
                      className={getLevelColor(log.level)}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mb-1">{log.message}</p>
                  {log.data !== undefined && (
                    <pre className="bg-muted/50 overflow-x-auto rounded p-2 text-xs">
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
