import type { GeoJSONFeature } from 'ol/format/GeoJSON'
import type { RefObject } from 'react'
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
        nodata: 0,
      },
    ],
    normalize: true,
    opaque: false,
    interpolate: true,
  })

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

  return new WebGLTileLayer({
    source: tiffSource,
    visible: false,
    opacity: tiffOpacity,
    properties: {
      title: year.toString(),
      type: 'overlay',
    },
    style: {
      color: colorScale,
    },
    zIndex: 100,
  })
}

function getTiffLayers(tiffOpacity: number) {
  const popdens = new LayerGroup({
    title: 'Population Density',
    fold: 'open',
    layers: [
      createTiffLayer('Population Density', '/data_display/pop_density/Assaba_Pop_2010.tif', 2010, tiffOpacity),
      createTiffLayer('Population Density', '/data_display/pop_density/Assaba_Pop_2015.tif', 2015, tiffOpacity),
      createTiffLayer('Population Density', '/data_display/pop_density/Assaba_Pop_2020.tif', 2020, tiffOpacity),
    ],
  })

  const years = Array.from({ length: 14 }, (_, i) => 2010 + i)
  const carbon = new LayerGroup({
    title: 'Carbon absorbtion',
    fold: 'open',
    layers: years.map(year => createTiffLayer('Carbon absorbtion', `/data_display/carbon_absorbtion/${year}_GP.tif`, year, tiffOpacity)),
  })
  const climate = new LayerGroup({
    title: 'Climate',
    fold: 'open',
    layers: years.map(year => createTiffLayer('Climate', `/data_display/climate/${year}R.tif`, year, tiffOpacity)),
  })
  const land = new LayerGroup({
    title: 'Land coverage',
    fold: 'open',
    layers: years.map(year => createTiffLayer('Land cover', `/data_display/land_cover/${year}LCT.tif`, year, tiffOpacity)),
  })

  return [popdens, carbon, climate, land]
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
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null)
  const [tiffOpacity, setTiffOpacity] = useState<number>(0.7)

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
          setSelectedFeature(feature.getProperties())
        }
        else {
          setSelectedFeature(null)
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

    tiffLayers.forEach(layer => map.addLayer(layer))

    return () => {
      if (map)
        tiffLayers.forEach(layer => map.removeLayer(layer))
    }
  }, [map, tiffLayers])

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

  return {
    selectedFeature,
    tiffOpacity,
    setTiffOpacity,
  }
}
