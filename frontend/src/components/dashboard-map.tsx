import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMap } from '@/hooks/use-map'
import { Info, Map as MapIcon } from 'lucide-react'
import React, { useRef } from 'react'
import 'ol/ol.css'
import 'ol-layerswitcher/dist/ol-layerswitcher.css'

export const DashboardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const { selectedFeature, tiffOpacity, setTiffOpacity, selectedYear, setSelectedYear } = useMap(mapRef)

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

                <div className="flex flex-col gap-8">
                  <h3 className="text-lg font-semibold mb-2">Opacity Control</h3>

                  <div className="space-y-4 min-w-[300px]">
                    <Label>Layer Opacity</Label>
                    <div>
                      <span
                        className="mb-3 flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground"
                        aria-hidden="true"
                      >
                        <span>Low</span>
                        <span>High</span>
                      </span>
                      <Slider
                        defaultValue={[0.5]}
                        min={0}
                        max={1}
                        step={0.1}
                        aria-label="Layer opacity slider"
                        value={[tiffOpacity]}
                        onValueChange={value => setTiffOpacity(value[0])}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 min-w-[300px]">
                    <Label>
                      Select year:
                      {' '}
                      {selectedYear}
                    </Label>
                    <div>
                      <span
                        className="mb-3 flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground"
                        aria-hidden="true"
                      >
                        <span>2010</span>
                        <span>2023</span>
                      </span>
                      <Slider
                        min={2010}
                        max={2023}
                        step={1}
                        value={[selectedYear]}
                        onValueChange={value => setSelectedYear(value[0])}
                      />
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
