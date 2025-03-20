import { Card } from '@/components/ui/card'
import { MyMap } from '@/Map'

import React from 'react'

const App: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Assaba Map Viewer</h1>
      <Card className="shadow-lg">
        <MyMap />
      </Card>
    </div>
  )
}

export default App
