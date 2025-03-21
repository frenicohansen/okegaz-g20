import type { BasicLayerInfo, StyleKey } from '@/hooks/use-map'
import { styles } from '@/hooks/use-map'

interface MapLegendProps {
  layer: BasicLayerInfo
}

export default function MapLegend({ layer }: MapLegendProps) {
  const title = layer.title as StyleKey
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
