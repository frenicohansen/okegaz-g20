import { Card } from '@/components/ui/card' // Example shadcn Card, adjust the import as needed

import { MyMap } from '@/Map'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// src/App.tsx
import React from 'react'

const queryClient = new QueryClient()

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Assaba Map Viewer</h1>
        <Card className="shadow-lg">
          <MyMap />
        </Card>
      </div>
    </QueryClientProvider>
  )
}

export default App
