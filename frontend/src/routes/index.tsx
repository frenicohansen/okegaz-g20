import { Dashboard } from '@/components/dashboard'
import { DashboardMap } from '@/components/dashboard-map'
import { Card } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Assaba Map Viewer</h1>
      <Card className="shadow-lg">
        <DashboardMap />
      </Card>
      <Dashboard />
    </div>
  )
}
