import type { GeoJSONFeature } from 'ol/format/GeoJSON'
import type { RefObject } from 'react'
import { Feature } from 'ol'
import LayerSwitcher from 'ol-layerswitcher'
import { click } from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'
import Select from 'ol/interaction/Select'
import LayerGroup from 'ol/layer/Group'
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

function createTiffLayer(name: string, url: string, year: number, tiffOpacity: number) {
  const tiffSource = new GeoTIFF({
    sources: [
      {
        url,
      },
    ],
  })

  return new WebGLTileLayer({
    source: tiffSource,
    visible: true,
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
    return { year, layer: createTiffLayer('Carbon absorbtion', `/data_display/carbon_absorbtion/${year}_GP.tif`, year, tiffOpacity) }
  })

  const climate = years.map((year) => {
    return { year, layer: createTiffLayer('Climate', `/data_display/climate/${year}R.tif`, year, tiffOpacity) }
  })

  const land = years.map((year) => {
    return { year, layer: createTiffLayer('Land cover', `/data_display/land_cover/${year}LCT.tif`, year, tiffOpacity) }
  })

  return { carbon, climate, land }
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

export function useMap(mapRef: RefObject<HTMLDivElement | null>) {
  const [map, setMap] = useState<Map | null>(null)

  const selectInteractionRef = useRef<Select | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<GeoJSONFeature | null>(null)
  const [tiffOpacity, setTiffOpacity] = useState<number>(0.7)
  const [selectedYear, setSelectedYear] = useState<number>(2010)
  const [districtNames, setDistrictNames] = useState<string[]>([])
  const districtSourceRef = useRef<VectorSource | null>(null)

  const baseLayers = useMemo(() => getMapBaseLayers(), [])
  const districtLayer = useMemo(() => getDistrictLayer(), [])
  const selectedStyle = useMemo(() => getSelectedStyle(), [])
  const tiffLayers = useMemo(() => getTiffLayers(tiffOpacity), [tiffOpacity])

  useEffect(() => {
    if (!mapRef.current)
      return

    const map = new Map({
      layers: baseLayers,
      view: new View({
        center: fromLonLat([-12.5, 16.5]), // Approximate center of Assaba region
        zoom: 8,
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

    map.addLayer(districtLayer)

    // Store the district source for later use in search
    if (districtLayer.getSource()) {
      districtSourceRef.current = districtLayer.getSource() as VectorSource

      // When source is loaded, extract district names
      districtSourceRef.current.once('change', () => {
        if (districtSourceRef.current && districtSourceRef.current.getState() === 'ready') {
          const features = districtSourceRef.current.getFeatures()
          const names = features
            .map(feature => feature.get('ADM3_EN'))
            .filter(name => !!name) // Filter out undefined/null values
          setDistrictNames(names)
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
          setSelectedDistrict(feature.getProperties())
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

    const layersSelectedYear = Object.values(tiffLayers).map(layers => layers.find(({ year }) => year === selectedYear))
    layersSelectedYear.forEach((layer) => {
      if (layer)
        map.addLayer(layer.layer)
    })

    return () => {
      if (map) {
        layersSelectedYear.forEach((layer) => {
          if (layer)
            map.removeLayer(layer.layer)
        })
      }
    }
  }, [map, tiffLayers, selectedYear])

  useEffect(() => {
    if (!map)
      return

    const layerSwitcher = new LayerSwitcher({
      tipLabel: 'Legend',
      groupSelectStyle: 'group',
      reverse: true,
    })
    map.addControl(layerSwitcher)

    return () => {
      if (map)
        map.removeControl(layerSwitcher)
    }
  }, [map])

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

  return {
    selectedDistrict,
    tiffOpacity,
    setTiffOpacity,
    selectedYear,
    setSelectedYear,
    searchDistrict,
    districtNames,
  }
}
