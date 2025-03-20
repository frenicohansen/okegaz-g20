'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, ChevronUp, Eye, EyeOff, Info, Layers } from 'lucide-react'
import { useState } from 'react'
import { Switch } from '../ui/switch'
import LayerLegend from './legend'

interface MapPanelProps {
  layers: any[]
  toggleLayer: (title: string) => void
}

export function MapPanel({ layers, toggleLayer }: MapPanelProps) {
  const [activeTab, setActiveTab] = useState('layers')
  const baseLayers = layers.filter(layer => layer.get('type') === 'base')
  const overlayLayers = layers.filter(layer => layer.get('type') === 'overlay')

  return (
    <div className="absolute bottom-2 left-2 z-10 w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out">
      <Tabs defaultValue="layers" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="layers" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>Layers</span>
          </TabsTrigger>
          <TabsTrigger value="legend" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>Legend</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="mt-0">
          <Collapsible
            className="border border-gray-100 rounded-md overflow-hidden"
          >
            <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-gray-500" />
                <span className="font-medium text-sm">Base Map</span>
              </div>
              <ChevronDown size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 py-1 bg-gray-50/50">
              <div className="space-y-2">
                {baseLayers.map(layer => (
                  <div key={layer.get('title')} className="flex items-center justify-between p-1.5 rounded hover:bg-white/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers size={16} className="text-blue-500" />
                      <span className="text-sm truncate">{layer.get('title')}</span>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={layer.getVisible()}
                        onCheckedChange={() => toggleLayer(layer.get('title'))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible
            className="border border-gray-100 rounded-md overflow-hidden"
          >
            <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-gray-500" />
                <span className="font-medium text-sm">Layers</span>
              </div>
              <ChevronDown size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 py-1 bg-gray-50/50">
              <div className="space-y-2">
                {overlayLayers.map(layer => (
                  <div key={layer.get('title')} className="flex items-center justify-between p-1.5 rounded hover:bg-white/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers size={16} className="text-purple-500" />
                      <span className="text-sm truncate">{layer.get('title')}</span>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        checked={layer.getVisible()}
                        onCheckedChange={() => toggleLayer(layer.get('title'))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="legend" className="mt-0">
          <h3 className="text-sm font-medium mb-2">Map Legend</h3>
          {overlayLayers.length > 0
            ? (
                <div className="space-y-4">
                  {overlayLayers.map(layer => (
                    <LayerLegend key={layer.get('title')} layer={layer} />
                  ))}
                </div>
              )
            : (
                <p className="text-sm text-muted-foreground">No visible layers to display in legend.</p>
              )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
