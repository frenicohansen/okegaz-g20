import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMap } from '@/hooks/use-map'
import { Info, Map as MapIcon } from 'lucide-react'
import React, { useRef } from 'react'
import 'ol/ol.css'
import 'ol-layerswitcher/dist/ol-layerswitcher.css'

export const DashboardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const { selectedFeature, tiffOpacity, setTiffOpacity } = useMap(mapRef)

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200"></div>
          {/* Map controls will be rendered directly on the map by OpenLayers */}
        </div>
        <div className="flex flex-col">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">
                <Info className="h-4 w-4 mr-2" />
                Info
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                <MapIcon className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="p-4 h-[calc(100vh-350px)] overflow-auto">
              {selectedFeature
                ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {selectedFeature.ADM3_EN ?? 'Feature Info'}
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(selectedFeature.properties || {}).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2">
                            <span className="font-medium">
                              {key}
                              :
                            </span>
                            <span>{value?.toString() || 'N/A'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Click on a feature to see details
                    </div>
                  )}
            </TabsContent>
            <TabsContent value="details" className="p-4 h-[calc(100vh-350px)] overflow-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">About Assaba</h3>
                  <p className="text-sm">
                    Assaba is a region in southern Mauritania. This dashboard visualizes
                    districts, roads, and water bodies in the region using GeoJSON data.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Opacity Control</h3>
                  <div className="space-y-1">
                    <label htmlFor="tiff-opacity" className="text-sm font-medium">
                      Layer Opacity:
                    </label>
                    <input
                      type="range"
                      id="tiff-opacity"
                      min="0"
                      max="1"
                      step="0.1"
                      value={tiffOpacity}
                      onChange={e => setTiffOpacity(Number.parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="mt-2">
                    <div className="w-full h-4 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded"></div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
