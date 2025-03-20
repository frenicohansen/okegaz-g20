import type Map from 'ol/Map'
import type React from 'react'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import GeoTIFF from 'ol/source/GeoTIFF'

import { useEffect, useState } from 'react'

interface DashboardTIFFLayerProps {
  mapInstance: Map | null
  visible: boolean
  year: '2010' | '2015' | '2020'
  opacity: number
}

export const DashboardTIFFLayer: React.FC<DashboardTIFFLayerProps> = ({
  mapInstance,
  visible,
  year,
  opacity,
}) => {
  const [tiffLayer, setTiffLayer] = useState<WebGLTileLayer | null>(null)

  useEffect(() => {
    if (!mapInstance)
      return

    // Clean up previous layer if it exists
    if (tiffLayer) {
      mapInstance.removeLayer(tiffLayer)
    }

    // Define the TIFF source
    const tiffSource = new GeoTIFF({
      sources: [
        {
          url: `/data_display/carbon_absorption/data_display/pop_density/Assaba_Pop_${year}.tif`,
          // The following properties might need adjustment based on your TIFF files
          nodata: 0,
        },
      ],
      // You may need to adjust these parameters based on your TIFF metadata
      normalize: true,
      opaque: false,
    })

    // Create a new WebGL Tile layer
    const newTiffLayer = new WebGLTileLayer({
      source: tiffSource,
      visible,
      opacity,
      properties: {
        title: `Population Density ${year}`,
        type: 'overlay',
      },
      // You can customize the style for visualization
      style: {
        color: [
          'interpolate',
          ['linear'],
          ['band', 1],
          0,
          [0, 0, 0, 0],
          50,
          [0, 0, 1, 0.5],
          100,
          [0, 1, 1, 0.5],
          150,
          [0, 1, 0, 0.5],
          200,
          [1, 1, 0, 0.5],
          250,
          [1, 0, 0, 0.5],
        ],
      },
    })

    // Add the layer to the map
    mapInstance.addLayer(newTiffLayer)
    setTiffLayer(newTiffLayer)

    // Clean up function
    return () => {
      if (mapInstance && newTiffLayer) {
        mapInstance.removeLayer(newTiffLayer)
      }
    }
  }, [mapInstance, visible, year, opacity])

  // Update layer visibility when the visible prop changes
  useEffect(() => {
    if (tiffLayer) {
      tiffLayer.setVisible(visible)
    }
  }, [visible, tiffLayer])

  // Update layer opacity when the opacity prop changes
  useEffect(() => {
    if (tiffLayer) {
      tiffLayer.setOpacity(opacity)
    }
  }, [opacity, tiffLayer])

  return <></>
}
