import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'log' | 'error' | 'warn';
}

export const DebugConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intercept console.log, console.error, console.warn
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3
      });

      setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs appear
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n');
    
    // Try to copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logText).then(() => {
        alert('Logs copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy logs');
      });
    } else {
      alert('Clipboard API not available');
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg font-mono text-xs font-bold"
        style={{ touchAction: 'manipulation' }}
      >
        {isOpen ? '✕' : 'LOG'}
      </button>

      {/* Debug Console Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9998] bg-black bg-opacity-95 flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
            <h2 className="text-lg font-bold font-mono">Debug Console</h2>
            <div className="flex gap-2">
              <button
                onClick={copyLogs}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Copy
              </button>
              <button
                onClick={clearLogs}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>

          {/* Logs Container */}
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-xs"
          >
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center mt-8">
                No logs yet. Logs will appear here as the app runs.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-2 border-b border-gray-800 pb-2">
                  <div className="flex gap-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span className={getLogColor(log.type)}>
                      [{log.type.toUpperCase()}]
                    </span>
                  </div>
                  <div className="text-gray-300 whitespace-pre-wrap break-all mt-1">
                    {log.message}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats Footer */}
          <div className="bg-gray-900 text-gray-400 p-2 text-xs font-mono border-t border-gray-700">
            Total Logs: {logs.length} | Errors: {logs.filter(l => l.type === 'error').length} | Warnings: {logs.filter(l => l.type === 'warn').length}
          </div>
        </div>
      )}
    </>
  );
};
