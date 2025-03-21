import type { GeoJSONFeature } from 'ol/format/GeoJSON'
import type { RefObject } from 'react'
import { useData } from '@/context/DataContext'
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

import { useEffect, useMemo, useRef, useState } from 'react'

export type StyleKey = keyof typeof styles
export const styles = {
  Region: {
    title: 'Region',
    fill: 'rgba(255, 255, 204, 0.2)',
    stroke: '#cc9933',
  },
  Roads: {
    title: 'Roads',
    fill: '#ffffff',
    stroke: '#ff3333',
  },
  Water: {
    title: 'Water',
    fill: 'rgba(51, 153, 255, 0.5)',
    stroke: '#0066cc',
  },
  Districts: {
    title: 'Districts',
    fill: 'rgba(204, 204, 255, 0.3)',
    stroke: '#6666cc',
  },
  Conflicts: {
    title: 'Conflicts',
    fill: 'rgba(255, 153, 153, 0.5)',
    stroke: '#cc3333',
  },
}

function createTiffLayer(
  name: string,
  url: string,
  year: number,
  tiffOpacity: number,
  _visible = false,
) {
  const tiffSource = new GeoTIFF({
    sources: [
      {
        url,
      },
    ],
  })

  return new WebGLTileLayer({
    source: tiffSource,
    visible: false,
    opacity: tiffOpacity,
    properties: {
      title: `${name} ${year.toString()}`,
      type: 'overlay',
    },
    zIndex: 100,
  })
}

function getTiffLayers(tiffOpacity: number) {
  const years = Array.from({ length: 14 }, (_, i) => 2010 + i)
  const carbon = years.map((year) => {
    return {
      year,
      layer: createTiffLayer(
        'Carbon absorbtion',
        `/data_display/carbon_absorbtion/${year}_GP.tif`,
        year,
        tiffOpacity,
      ),
    }
  })

  const climate = years.map((year) => {
    return {
      year,
      layer: createTiffLayer(
        'Climate',
        `/data_display/climate/${year}R.tif`,
        year,
        tiffOpacity,
      ),
    }
  })

  const land = years.map((year) => {
    return {
      year,
      layer: createTiffLayer(
        'Land cover',
        `/data_display/land_cover/${year}LCT.tif`,
        year,
        tiffOpacity,
      ),
    }
  })

  const population = years.map((year) => {
    return {
      year,
      layer: createTiffLayer(
        'population',
        `/data_display/pop_density/Assaba_Pop_${year}.tif`,
        year,
        tiffOpacity,
      ),
    }
  })

  return { carbon, climate, land, population }
}

function getMapBaseLayers() {
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

  const regionStyle = new Style({
    fill: new Fill({
      color: styles.Region.fill,
    }),
    stroke: new Stroke({
      color: styles.Region.stroke,
      width: 3,
    }),
  })

  const roadStyle = new Style({
    stroke: new Stroke({
      color: styles.Roads.stroke,
      width: 2,
    }),
  })

  const waterStyle = new Style({
    fill: new Fill({
      color: styles.Water.fill,
    }),
    stroke: new Stroke({
      color: styles.Water.stroke,
      width: 1,
    }),
  })

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

  return [osmLayer, satelliteLayer, regionLayer, roadLayer, waterLayer]
}

function getDistrictLayer() {
  const districtSource = new VectorSource({
    url: '/GeoJSON/Assaba_Districts_Layer.geojson',
    format: new GeoJSON(),
  })
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

  const districtLayer = new VectorLayer({
    source: districtSource,
    style: districtStyle,
    properties: {
      title: 'Districts',
      type: 'overlay',
    },
  })

  return districtLayer
}

function getSelectedStyle() {
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

export interface BasicLayerInfo {
  title: string
  visible: boolean
  type: 'base' | 'overlay' | 'tiff'
}

export function useMap(mapRef: RefObject<HTMLDivElement | null>) {
  const [map, setMap] = useState<Map | null>(null)

  const selectInteractionRef = useRef<Select | null>(null)
  const [selectedDistrict, setSelectedDistrict]
    = useState<GeoJSONFeature | null>(null)
  const [tiffOpacity, setTiffOpacity] = useState<number>(0.7)
  const [districtNames, setDistrictNames] = useState<string[]>([])
  const districtSourceRef = useRef<VectorSource | null>(null)

  const baseLayers = useMemo(() => getMapBaseLayers(), [])
  const districtLayer = useMemo(() => getDistrictLayer(), [])
  const selectedStyle = useMemo(() => getSelectedStyle(), [])
  const tiffLayers = useMemo(() => getTiffLayers(tiffOpacity), [tiffOpacity])
  const [layers, setLayers] = useState<BasicLayerInfo[]>([])
  const [selectedBase, setSelectedBase] = useState('OpenStreetMap')

  const { selectedYear } = useData()

  useEffect(() => {
    const layersSelectedYear = Object.values(tiffLayers).map(layers =>
      layers.find(({ year }) => year === selectedYear),
    )

    setLayers([
      ...baseLayers.map(layer => ({
        title: layer.get('title'),
        visible: layer.getVisible(),
        type: layer.get('type'),
      })),
      ...layersSelectedYear.map(layer => ({
        title: layer?.layer.get('title') ?? '',
        visible: layer?.layer.getVisible() ?? false,
        type: 'tiff',
      })),
      {
        title: districtLayer.get('title'),
        visible: districtLayer.getVisible(),
        type: districtLayer.get('type'),
      },
      { title: 'Conflicts', visible: true, type: 'overlay' },
    ])
  }, [selectedYear])

  const { setSelectedDistrict: setSelectedDistrictStr } = useData()

  useEffect(() => {
    if (!mapRef.current)
      return

    const map = new Map({
      layers: baseLayers,
      view: new View({
        center: fromLonLat([-12.5, 16.5]), // Approximate center of Assaba region
        zoom: 8,
      }),
      controls: defaultControls({
        zoom: true,
        rotate: false,
        attribution: true,
      }),
    })
    map.setTarget(mapRef.current)
    setMap(map)

    return () => {
      if (map) {
        map.dispose()
      }
    }
  }, [baseLayers, mapRef])

  useEffect(() => {
    if (!map)
      return

    map.getLayers().forEach((layer) => {
      if (layer.get('type') === 'base') {
        layer.setVisible(layer.get('title') === selectedBase)
      }
    })
  }, [map, selectedBase])

  useEffect(() => {
    if (!map)
      return

    map.addLayer(districtLayer)

    // Store the district source for later use in search
    if (districtLayer.getSource()) {
      districtSourceRef.current = districtLayer.getSource() as VectorSource

      // When source is loaded, extract district names
      districtSourceRef.current.once('change', () => {
        if (
          districtSourceRef.current
          && districtSourceRef.current.getState() === 'ready'
        ) {
          const features = districtSourceRef.current.getFeatures()
          const names = features
            .map(feature => feature.get('ADM3_EN'))
            .filter(name => !!name) // Filter out undefined/null values
          setDistrictNames(names)
          setSelectedDistrictStr(features[0].get('ADM3_EN'))
        }
      })
    }

    const currentSelect = new Select({
      layers: [districtLayer],
      style: selectedStyle,
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
          const geometry = feature.getGeometry()
          if (geometry) {
            const extent = geometry.getExtent()
            map.getView().fit(extent, {
              duration: 1000,
              padding: [50, 50, 50, 50],
              maxZoom: 10,
            })
          }
          setSelectedDistrict(feature.getProperties())
          const districtName = feature.get('ADM3_EN')

          setSelectedDistrictStr(districtName)
        }
        else {
          setSelectedDistrict(null)
        }
      })
    }

    return () => {
      if (map) {
        map.removeLayer(districtLayer)
        if (selectInteractionRef.current) {
          map.removeInteraction(selectInteractionRef.current)
        }
      }
    }
  }, [map, districtLayer, selectedStyle])

  useEffect(() => {
    if (!map)
      return

    const layersSelectedYear = Object.entries(tiffLayers).map(
      ([_, yearlyLayers]) =>
        yearlyLayers.find(({ year }) => year === selectedYear),
    )

    layersSelectedYear.forEach((layerObj) => {
      if (layerObj) {
        const { layer } = layerObj
        const saved = layers.find(l => l.title === layer.get('title'))
        layer.setVisible(saved?.visible ?? true) // reapply saved visibility
        map.addLayer(layer)
      }
    })

    return () => {
      layersSelectedYear.forEach((layerObj) => {
        if (layerObj) {
          map.removeLayer(layerObj.layer)
        }
      })
    }
  }, [map, tiffLayers, selectedYear, layers]) // ⬅️ include `layers` dependency

  useEffect(() => {
    if (!map)
      return

    const conflictLayer = new VectorLayer({
      source: new VectorSource({
        url: `/ConflictChoropleth/${selectedYear}_ConflictChoropleth.geojson`,
        format: new GeoJSON(),
      }),
      style: (feature) => {
        const properties = feature.getProperties()
        const conflictLevel = properties.cluster_label || 0

        let color
        switch (conflictLevel) {
          case 1:
            color = 'rgba(255, 255, 178, 0.7)'
            break
          case 2:
            color = 'rgba(254, 217, 118, 0.7)'
            break
          case 3:
            color = 'rgba(254, 178, 76, 0.7)'
            break
          case 4:
            color = 'rgba(253, 141, 60, 0.7)'
            break
          case 5:
            color = 'rgba(240, 59, 32, 0.7)'
            break
          case 6:
            color = 'rgba(189, 0, 38, 0.7)'
            break
          default:
            color = 'rgba(247, 247, 247, 0.4)'
        }

        return new Style({
          fill: new Fill({
            color,
          }),
          stroke: new Stroke({
            color: styles.Conflicts.stroke,
            width: 1,
          }),
        })
      },
      properties: {
        title: 'Conflicts',
        type: 'overlay',
      },
    })
    map.addLayer(conflictLayer)

    return () => {
      if (map) {
        map.removeLayer(conflictLayer)
      }
    }
  }, [map, selectedYear])

  // Function to search for a district by name and zoom to it
  const searchDistrict = (query: string) => {
    if (!map || !districtSourceRef.current)
      return

    // Get all features from the district source
    const features = districtSourceRef.current.getFeatures()

    // Find the feature that matches the query (case insensitive)
    const matchedFeature = features.find((feature) => {
      const name = feature.get('ADM3_EN')
      return name && name.toLowerCase().includes(query.toLowerCase())
    })

    if (matchedFeature) {
      // Get the geometry and its extent
      const geometry = matchedFeature.getGeometry()
      if (geometry) {
        // Zoom to the feature's extent with padding
        const extent = geometry.getExtent()
        map.getView().fit(extent, {
          duration: 1000,
          padding: [50, 50, 50, 50],
          maxZoom: 10,
        })

        // Select the feature
        if (selectInteractionRef.current) {
          selectInteractionRef.current.getFeatures().clear()
          selectInteractionRef.current.getFeatures().push(matchedFeature)
          setSelectedDistrict(matchedFeature.getProperties() as GeoJSONFeature)
        }
      }
    }
    else {
      console.warn('District not found:', query)
    }
  }

  const toggleLayerVisibility = (layerTitle: string) => {
    if (map) {
      map.getAllLayers().forEach((layer) => {
        const title = layer.getProperties().title
        if (title === layerTitle && layer.get('type') === 'overlay') {
          layer.setVisible(!layer.getVisible())
          setLayers((prevLayers) => {
            return prevLayers.map((prevLayer) => {
              if (prevLayer.title === layerTitle) {
                return { ...prevLayer, visible: layer.getVisible() }
              }
              return prevLayer
            })
          })
        }
      })
    }
  }

  return {
    layers,
    selectedBase,
    setSelectedBase,
    toggleLayerVisibility,
    selectedDistrict,
    tiffOpacity,
    setTiffOpacity,
    searchDistrict,
    districtNames,
  }
}
