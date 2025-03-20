import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, Map as MapIcon } from 'lucide-react'
import LayerSwitcher from 'ol-layerswitcher'
import { defaults as defaultControls } from 'ol/control'
import { click } from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'
import Select from 'ol/interaction/Select'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import Map from 'ol/Map'
import { fromLonLat } from 'ol/proj'
import { OSM, XYZ } from 'ol/source'
import GeoTIFF from 'ol/source/GeoTIFF'
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

export const DashboardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const selectInteractionRef = useRef<Select | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null)

  // TIFF layer controls
  const [tiffVisible, setTiffVisible] = useState<boolean>(true)
  const [tiffYear, setTiffYear] = useState<'2010' | '2015' | '2020'>('2010')
  const [tiffOpacity, setTiffOpacity] = useState<number>(0.7)

  // Track when map instance is ready
  const [mapReady, setMapReady] = useState<boolean>(false)

  // Store references to TIFF layers for each year
  const tiffLayerRefs = useRef<{
    2010: WebGLTileLayer | null
    2015: WebGLTileLayer | null
    2020: WebGLTileLayer | null
  }>({
    2010: null,
    2015: null,
    2020: null,
  })

  // Function to change the year by showing/hiding layers
  const changeYear = (year: '2010' | '2015' | '2020') => {
    console.warn(`Changing year to: ${year}`)

    // Hide all TIFF layers
    Object.entries(tiffLayerRefs.current).forEach(([_, layer]) => {
      if (layer) {
        layer.setVisible(false)
      }
    })

    // Show only the selected year's layer
    if (tiffLayerRefs.current[year]) {
      tiffLayerRefs.current[year]?.setVisible(tiffVisible)
    }
    else {
      console.warn(`TIFF layer for year ${year} not initialized yet`)
    }

    setTiffYear(year)
  }

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
    setMapReady(true) // Set map as ready for other components

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

  useEffect(() => {
    if (mapReady && mapInstanceRef.current) {
      // Initialize TIFF layers for all years
      const years: ('2010' | '2015' | '2020')[] = ['2010', '2015', '2020']

      years.forEach((year) => {
        try {
          // Try different path formats
          const basePath = `/data_display/pop_density`
          const tiffUrl = `${basePath}/Assaba_Pop_${year}.tif`
          const alternativeTiffUrl = `${basePath}/assaba_pop_${year.toLowerCase()}.tif`
          const alternativeTiffUrl2 = `${basePath}/Assaba_pop_${year}.tif`

          console.warn(`Initializing TIFF layer for year ${year}, trying paths:`, {
            primary: tiffUrl,
            alt1: alternativeTiffUrl,
            alt2: alternativeTiffUrl2,
          })

          // Check which file exists
          const checkFile = async (url: string) => {
            try {
              const response = await fetch(url, { method: 'HEAD' })
              return { url, exists: response.ok, status: response.status }
            }
            catch (error) {
              return { url, exists: false, error }
            }
          }

          // Check all possible file paths
          Promise.all([
            checkFile(tiffUrl),
            checkFile(alternativeTiffUrl),
            checkFile(alternativeTiffUrl2),
          ]).then((results) => {
            console.warn(`TIFF file check results for YEAR=${year}:`, results)

            // Find the first file that exists
            const existingFile = results.find(result => result.exists)

            if (existingFile && mapInstanceRef.current) {
              console.warn(`Found accessible TIFF file for year ${year}: ${existingFile.url}`)
              createTiffLayer(existingFile.url, year)
            }
            else {
              console.error(`No accessible TIFF file found for YEAR=${year}`)
            }
          })

          // Function to create the TIFF layer
          const createTiffLayer = (url: string, yearKey: '2010' | '2015' | '2020') => {
            if (!mapInstanceRef.current)
              return

            // Define the TIFF source
            const tiffSource = new GeoTIFF({
              sources: [
                {
                  url,
                  nodata: 0,
                },
              ],
              normalize: true,
              opaque: false,
              interpolate: true,
            })

            // Define color scale
            const colorScale = [
              'interpolate',
              ['linear'],
              ['band', 1],
              0,
              [0, 0, 0, 0],
              0.1,
              [0, 0, 1, 0.9],
              0.3,
              [0, 1, 1, 0.9],
              0.5,
              [0, 1, 0, 0.9],
              0.7,
              [1, 1, 0, 0.9],
              0.9,
              [1, 0, 0, 0.9],
            ]

            // Create the layer
            const newTiffLayer = new WebGLTileLayer({
              source: tiffSource,
              visible: yearKey === tiffYear, // Only show if it's the current year
              opacity: tiffOpacity,
              properties: {
                title: `Population Density ${yearKey}`,
                type: 'overlay',
              },
              style: {
                color: colorScale,
              },
              zIndex: 100,
            })

            // Store the layer reference
            tiffLayerRefs.current[yearKey] = newTiffLayer

            // Add the layer to the map
            mapInstanceRef.current.addLayer(newTiffLayer)
            console.warn(`Added TIFF layer for year ${yearKey}`)
          }
        }
        catch (error) {
          console.error(`Error initializing TIFF layer for year ${year}:`, error)
        }
      })
    }
  }, [mapReady, tiffOpacity])

  // Update layer visibility when tiffVisible changes
  useEffect(() => {
    if (tiffLayerRefs.current[tiffYear]) {
      tiffLayerRefs.current[tiffYear]?.setVisible(tiffVisible)
    }
  }, [tiffVisible, tiffYear])

  // Update layer opacity when tiffOpacity changes
  useEffect(() => {
    Object.values(tiffLayerRefs.current).forEach((layer) => {
      if (layer) {
        layer.setOpacity(tiffOpacity)
      }
    })
  }, [tiffOpacity])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200" />
          {/* TIFF layers are now managed directly in the map component */}
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

                {/* TIFF Layer Controls */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Population Density (TIFF)</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="tiff-visible"
                        checked={tiffVisible}
                        onChange={e => setTiffVisible(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="tiff-visible">Show Population Density</label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Year:</label>
                      <div className="flex space-x-2">
                        {['2010', '2015', '2020'].map(year => (
                          <button
                            type="button"
                            key={year}
                            onClick={() => {
                              changeYear(year as '2010' | '2015' | '2020')
                            }}
                            className={`px-2 py-1 text-sm rounded ${
                              tiffYear === year
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="tiff-opacity" className="text-sm font-medium">
                        Opacity:
                        {' '}
                        {Math.round(tiffOpacity * 100)}
                        %
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

                <div>
                  <h3 className="text-lg font-semibold mb-2">About Assaba</h3>
                  <p className="text-sm">
                    Assaba is a region in southern Mauritania. This dashboard visualizes
                    districts, roads, and water bodies in the region using GeoJSON data.
                    The population density layer shows demographic distribution across different years.
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
