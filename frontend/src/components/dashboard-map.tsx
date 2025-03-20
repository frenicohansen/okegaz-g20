import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, Info, Layers, Map as MapIcon } from 'lucide-react'
import LayerSwitcher from 'ol-layerswitcher'
import { defaults as defaultControls } from 'ol/control'
import GeoJSON from 'ol/format/GeoJSON'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import { fromLonLat } from 'ol/proj'
import { OSM, XYZ } from 'ol/source'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import View from 'ol/View'
import Select from 'ol/interaction/Select'
import { click } from 'ol/events/condition'
import React, { useEffect, useRef, useState } from 'react'
import 'ol/ol.css'
import 'ol-layerswitcher/dist/ol-layerswitcher.css'

interface GeoJSONFeature {
  type: string
  geometry: {
    type: string
    coordinates: any[]
  },
  [key: string]: any
}

export const MyMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const selectInteractionRef = useRef<Select | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null)
  const [layerVisibility, setLayerVisibility] = useState({
    districts: true,
    region: true,
    roads: true,
    water: true,
    baseLayer: 'osm',
  })
  const [mapStats, setMapStats] = useState({
    districts: 0,
    roads: 0,
    waterBodies: 0,
  })

  useEffect(() => {
    if (!mapRef.current)
      return

    // Clean up previous select interaction if it exists
    if (mapInstanceRef.current && selectInteractionRef.current) {
      mapInstanceRef.current.removeInteraction(selectInteractionRef.current)
      selectInteractionRef.current = null
    }

    // Create vector sources for each GeoJSON layer
    const districtSource = new VectorSource({
      url: '/GeoJSON/Assaba_Districts_Layer.geojson',
      format: new GeoJSON(),
    })

    const regionSource = new VectorSource({
      url: '/GeoJSON/Assaba_Region.geojson',
      format: new GeoJSON(),
    })

    const roadSource = new VectorSource({
      url: '/GeoJSON/Main_Road.geojson',
      format: new GeoJSON(),
    })

    const waterSource = new VectorSource({
      url: '/GeoJSON/Streamwater.geojson',
      format: new GeoJSON(),
    })

    // Style functions for different layers
    const districtStyle = new Style({
      fill: new Fill({
        color: 'rgba(204, 204, 255, 0.3)',
      }),
      stroke: new Stroke({
        color: '#6666cc',
        width: 2,
      }),
      zIndex: 1, // Base zIndex for normal features
    })

    // Custom style function for selection to ensure it completely replaces existing styles
    const createSelectedStyle = () => {
      return [
        new Style({
          fill: new Fill({
            color: 'rgba(255, 204, 0, 0.4)',
          }),
          stroke: new Stroke({
            color: '#ff9900',
            width: 3,
            lineCap: 'round',
            lineJoin: 'round',
          }),
          zIndex: 1000, // Very high zIndex to ensure it's on top
        })
      ];
    }

    const regionStyle = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 204, 0.2)',
      }),
      stroke: new Stroke({
        color: '#cc9933',
        width: 3,
      }),
    })

    const roadStyle = new Style({
      stroke: new Stroke({
        color: '#ff3333',
        width: 2,
      }),
    })

    const waterStyle = new Style({
      fill: new Fill({
        color: 'rgba(51, 153, 255, 0.5)',
      }),
      stroke: new Stroke({
        color: '#0066cc',
        width: 1,
      }),
    })

    // Create base layers (only one can be visible at a time)
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: layerVisibility.baseLayer === 'osm',
      properties: {
        title: 'OpenStreetMap',
        type: 'base',
      },
    })

    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles Esri',
      }),
      visible: layerVisibility.baseLayer === 'satellite',
      properties: {
        title: 'Satellite',
        type: 'base',
      },
    })

    // Create vector layers as overlays (can be toggled independently)
    const districtLayer = new VectorLayer({
      source: districtSource,
      style: districtStyle,
      visible: layerVisibility.districts,
      properties: {
        title: 'Districts',
        type: 'overlay',
      },
    })

    const regionLayer = new VectorLayer({
      source: regionSource,
      style: regionStyle,
      visible: layerVisibility.region,
      properties: {
        title: 'Region',
        type: 'overlay',
      },
    })

    const roadLayer = new VectorLayer({
      source: roadSource,
      style: roadStyle,
      visible: layerVisibility.roads,
      properties: {
        title: 'Roads',
        type: 'overlay',
      },
    })

    const waterLayer = new VectorLayer({
      source: waterSource,
      style: waterStyle,
      visible: layerVisibility.water,
      properties: {
        title: 'Water',
        type: 'overlay',
      },
    })

    // Create the map with proper layer groups
    const map = new Map({
      target: mapRef.current,
      layers: [
        // Base layers group (only one visible at a time)
        osmLayer,
        satelliteLayer,
        // Overlay layers group (can be toggled independently)
        regionLayer,
        districtLayer,
        roadLayer,
        waterLayer,
      ],
      view: new View({
        center: fromLonLat([-12.5, 16.5]), // Approximate center of Assaba region
        zoom: 8,
      }),
      controls: defaultControls(),
    })

    // Create select interaction with styling function
    const currentSelect = new Select({
      layers: [districtLayer],
      style: createSelectedStyle,
      condition: click,
      multi: false,
      hitTolerance: 0,
    })

    if (currentSelect) {
      map.addInteraction(currentSelect)
      selectInteractionRef.current = currentSelect
      
      currentSelect.on('select', (_e) => {
        const features = currentSelect.getFeatures()
        const featureCount = features.getLength()
                
        if (featureCount > 0) {
          const feature = features.item(0)
          // @ts-expect-error - GeoJSON feature properties
          setSelectedFeature(feature.getProperties())
        }
        else {
          setSelectedFeature(null)
        }
      })
    }

    // Add layer switcher control with proper grouping
    const layerSwitcher = new LayerSwitcher({
      tipLabel: 'Legend',
      groupSelectStyle: 'group',
      reverse: true,
    })
    map.addControl(layerSwitcher)

    // Calculate statistics when sources are loaded
    const updateStats = () => {
      setMapStats({
        districts: districtSource.getFeatures().length,
        roads: roadSource.getFeatures().length,
        waterBodies: waterSource.getFeatures().length,
      })
    }

    districtSource.on('change', () => {
      if (districtSource.getState() === 'ready') {
        updateStats()
      }
    })

    roadSource.on('change', () => {
      if (roadSource.getState() === 'ready') {
        updateStats()
      }
    })

    waterSource.on('change', () => {
      if (waterSource.getState() === 'ready') {
        updateStats()
      }
    })

    mapInstanceRef.current = map

    return () => {
      if (selectInteractionRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeInteraction(selectInteractionRef.current)
        selectInteractionRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
      }
    }
  }, [layerVisibility])

  // Toggle layer visibility
  const toggleLayer = (layer: keyof typeof layerVisibility) => {
    if (layer === 'baseLayer') {
      setLayerVisibility(prev => ({
        ...prev,
        baseLayer: prev.baseLayer === 'osm' ? 'satellite' : 'osm',
      }))
    }
    else {
      setLayerVisibility(prev => ({
        ...prev,
        [layer]: !prev[layer],
      }))
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Assaba Region Dashboard</h2>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Layers className="h-4 w-4 mr-2" />
                Layers
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toggleLayer('baseLayer')}>
                <input
                  type="radio"
                  checked={layerVisibility.baseLayer === 'osm'}
                  onChange={() => {}}
                  className="mr-2"
                />
                OpenStreetMap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleLayer('baseLayer')}>
                <input
                  type="radio"
                  checked={layerVisibility.baseLayer === 'satellite'}
                  onChange={() => {}}
                  className="mr-2"
                />
                Satellite
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleLayer('districts')}>
                <input
                  type="checkbox"
                  checked={layerVisibility.districts}
                  onChange={() => {}}
                  className="mr-2"
                />
                Districts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleLayer('region')}>
                <input
                  type="checkbox"
                  checked={layerVisibility.region}
                  onChange={() => {}}
                  className="mr-2"
                />
                Region
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleLayer('roads')}>
                <input
                  type="checkbox"
                  checked={layerVisibility.roads}
                  onChange={() => {}}
                  className="mr-2"
                />
                Roads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleLayer('water')}>
                <input
                  type="checkbox"
                  checked={layerVisibility.water}
                  onChange={() => {}}
                  className="mr-2"
                />
                Water Bodies
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card className="p-4 flex flex-col items-center">
          <div className="text-lg font-semibold">Districts</div>
          <div className="text-3xl font-bold">{mapStats.districts}</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <div className="text-lg font-semibold">Roads</div>
          <div className="text-3xl font-bold">{mapStats.roads}</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <div className="text-lg font-semibold">Water Bodies</div>
          <div className="text-3xl font-bold">{mapStats.waterBodies}</div>
        </Card>
        <Card className="p-4 flex flex-col items-center">
          <div className="text-lg font-semibold">Total Features</div>
          <div className="text-3xl font-bold">
            {mapStats.districts + mapStats.roads + mapStats.waterBodies}
          </div>
        </Card>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200" />
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
                  <h3 className="text-lg font-semibold mb-2">Map Layers</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <div className="w-4 h-4 bg-[rgba(204,204,255,0.3)] border-2 border-[#6666cc] mr-2"></div>
                      <span>Districts</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-4 h-4 bg-[rgba(255,204,0,0.4)] border-2 border-[#ff9900] mr-2"></div>
                      <span>Selected District</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-4 h-4 bg-[rgba(255,255,204,0.2)] border-2 border-[#cc9933] mr-2"></div>
                      <span>Region</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-4 h-4 bg-white border-2 border-[#ff3333] mr-2"></div>
                      <span>Roads</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-4 h-4 bg-[rgba(51,153,255,0.5)] border-2 border-[#0066cc] mr-2"></div>
                      <span>Water Bodies</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">About Assaba</h3>
                  <p className="text-sm">
                    Assaba is a region in southern Mauritania. This dashboard visualizes
                    districts, roads, and water bodies in the region using GeoJSON data.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}