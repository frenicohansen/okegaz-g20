import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, Map as MapIcon } from 'lucide-react'
import LayerSwitcher from 'ol-layerswitcher'
import { defaults as defaultControls } from 'ol/control'
import { click } from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'
import Select from 'ol/interaction/Select'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import { fromLonLat } from 'ol/proj'
import { OSM, XYZ } from 'ol/source'
import VectorSource from 'ol/source/Vector'
import { Fill, Stroke, Style } from 'ol/style'
import View from 'ol/View'
import React, { useEffect, useRef, useState } from 'react'
import 'ol/ol.css'
import 'ol-layerswitcher/dist/ol-layerswitcher.css'

interface GeoJSONFeature {
  type: string
  geometry: {
    type: string
    coordinates: any[]
  }
  [key: string]: any
}

export const MyMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const selectInteractionRef = useRef<Select | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null)

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
        }),
      ]
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
      properties: {
        title: 'Satellite',
        type: 'base',
      },
    })

    // Create vector layers as overlays (can be toggled independently)
    const districtLayer = new VectorLayer({
      source: districtSource,
      style: districtStyle,
      properties: {
        title: 'Districts',
        type: 'overlay',
      },
    })

    const regionLayer = new VectorLayer({
      source: regionSource,
      style: regionStyle,
      properties: {
        title: 'Region',
        type: 'overlay',
      },
    })

    const roadLayer = new VectorLayer({
      source: roadSource,
      style: roadStyle,
      properties: {
        title: 'Roads',
        type: 'overlay',
      },
    })

    const waterLayer = new VectorLayer({
      source: waterSource,
      style: waterStyle,
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
        satelliteLayer,
        osmLayer,
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
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
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
