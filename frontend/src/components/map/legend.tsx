import type { StyleKey } from '@/hooks/use-map'
import { styles } from '@/hooks/use-map'

interface MapLegendProps {
  layer: any
}

export default function MapLegend({ layer }: MapLegendProps) {
  const title = layer.get('title') as StyleKey
  return (
    <div className="flex items-center space-x-2">
      <div
        className="w-6 h-6 rounded border"
        style={{
          backgroundColor: styles[title].fill,
          borderColor: styles[title].stroke,
          borderWidth: '2px',
        }}
      />
      <span className="text-sm">{title}</span>
    </div>
  )
}
