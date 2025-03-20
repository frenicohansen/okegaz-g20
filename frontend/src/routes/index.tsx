import { Dashboard } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { MyMap } from '@/Map'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Assaba Map Viewer</h1>
      <Card className="shadow-lg">
        <MyMap />
      </Card>
      <Dashboard />
    </div>
  )
}
