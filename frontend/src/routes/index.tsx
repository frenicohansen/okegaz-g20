import { Dashboard } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { MyMap } from '@/Map'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const queryClient = new QueryClient()

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Assaba Map Viewer</h1>
        <Card className="shadow-lg">
          <MyMap />
        </Card>
      </div>
      <Dashboard />
    </QueryClientProvider>
  )
}
