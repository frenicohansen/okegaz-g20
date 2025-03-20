import type Map from 'ol/Map'
import type React from 'react'
import TileLayer from 'ol/layer/Tile'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import GeoTIFF from 'ol/source/GeoTIFF'
import XYZ from 'ol/source/XYZ'

import { useEffect, useRef } from 'react'

interface DashboardTIFFLayerProps {
  mapInstance: Map
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
  // Use a ref to keep track of the current layer
  const tiffLayerRef = useRef<WebGLTileLayer | null>(null)
  // Use a ref to keep track of the debug layer
  const debugLayerRef = useRef<TileLayer<XYZ> | null>(null)

  // Cleanup function to remove layers
  const cleanupLayers = useRef(() => {
    if (tiffLayerRef.current && mapInstance) {
      console.warn('DashboardTIFFLayer: Removing previous TIFF layer')
      mapInstance.removeLayer(tiffLayerRef.current)
      tiffLayerRef.current = null
    }

    if (debugLayerRef.current && mapInstance) {
      console.warn('DashboardTIFFLayer: Removing debug layer')
      mapInstance.removeLayer(debugLayerRef.current)
      debugLayerRef.current = null
    }
  }).current

  useEffect(() => {
    if (!mapInstance) {
      console.warn('DashboardTIFFLayer: No map instance')
      return
    }

    console.warn(`DashboardTIFFLayer: Creating TIFF layer for YEAR=${year}`, { visible, opacity })

    // Clean up previous layers
    cleanupLayers()

    try {
      // For debugging: Add a placeholder colored layer if TIFF fails
      const debugLayer = new TileLayer({
        source: new XYZ({
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        }),
        opacity: 0.3,
        visible: false,
        zIndex: 99,
      })

      // Store the debug layer in the ref
      debugLayerRef.current = debugLayer

      // Add debug layer to map (will be invisible unless TIFF fails)
      mapInstance.addLayer(debugLayer)

      // Check if TIFF file is accessible
      // Try different path formats to see which one works
      const basePath = `/data_display/pop_density`
      const tiffUrl = `${basePath}/Assaba_Pop_${year}.tif`
      const alternativeTiffUrl = `${basePath}/assaba_pop_${year.toLowerCase()}.tif` // Try lowercase
      const alternativeTiffUrl2 = `${basePath}/Assaba_pop_${year}.tif` // Try mixed case

      console.warn(`Attempting to load TIFF for YEAR=${year}, trying multiple paths:`, {
        primary: tiffUrl,
        alt1: alternativeTiffUrl,
        alt2: alternativeTiffUrl2,
      })

      // Check all possible file paths
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

        if (existingFile) {
          console.warn(`Found accessible TIFF file: ${existingFile.url}`)
          createTiffLayer(existingFile.url)
        }
        else {
          console.error(`No accessible TIFF file found for YEAR=${year}`)
          // Make debug layer visible if no TIFF is accessible
          if (debugLayerRef.current) {
            debugLayerRef.current.setVisible(true)
          }
        }
      })

      // Function to create the TIFF layer
      const createTiffLayer = (url: string) => {
        // Define the TIFF source with improved configuration
        const tiffSource = new GeoTIFF({
          sources: [
            {
              url,
              nodata: 0,
            },
          ],
          normalize: true, // Normalize to ensure consistent visualization across years
          opaque: false,
          interpolate: true, // Enable interpolation for smoother rendering
        })

        console.warn(`DashboardTIFFLayer: TIFF source created for YEAR=${year}`, tiffSource)

        // Define different styles based on the year
        let colorScale

        // Use different color scales for different years
        switch (year) {
          case '2010':
            colorScale = [
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
            break
          case '2015':
            colorScale = [
              'interpolate',
              ['linear'],
              ['band', 1],
              0,
              [0, 0, 0, 0],
              0.2,
              [0, 0, 1, 0.9],
              0.4,
              [0, 1, 1, 0.9],
              0.6,
              [0, 1, 0, 0.9],
              0.8,
              [1, 1, 0, 0.9],
              1.0,
              [1, 0, 0, 0.9],
            ]
            break
          case '2020':
            colorScale = [
              'interpolate',
              ['linear'],
              ['band', 1],
              0,
              [0, 0, 0, 0],
              0.2,
              [0, 0, 1, 0.9],
              0.4,
              [0, 1, 1, 0.9],
              0.6,
              [0, 1, 0, 0.9],
              0.8,
              [1, 1, 0, 0.9],
              1.0,
              [1, 0, 0, 0.9],
            ]
            break
          default:
            colorScale = [
              'interpolate',
              ['linear'],
              ['band', 1],
              0,
              [0, 0, 0, 0],
              0.2,
              [0, 0, 1, 0.9],
              0.4,
              [0, 1, 1, 0.9],
              0.6,
              [0, 1, 0, 0.9],
              0.8,
              [1, 1, 0, 0.9],
              1.0,
              [1, 0, 0, 0.9],
            ]
        }

        // Create a new WebGL Tile layer with improved visibility
        const newTiffLayer = new WebGLTileLayer({
          source: tiffSource,
          visible,
          opacity,
          properties: {
            title: `Population Density ${year}`,
            type: 'overlay',
          },
          style: {
            color: colorScale,
          },
          zIndex: 100, // Ensure it's above all other layers
        })

        // Store the TIFF layer in the ref
        tiffLayerRef.current = newTiffLayer

        // Add the TIFF layer to the map
        mapInstance.addLayer(newTiffLayer)

        console.warn(`DashboardTIFFLayer: TIFF layer added for YEAR=${year}`)
      }
    }
    catch (error) {
      console.error('Error in TIFF layer setup:', error)

      // Make debug layer visible on error
      if (debugLayerRef.current) {
        debugLayerRef.current.setVisible(true)
      }
    }

    // Clean up when the component unmounts or when dependencies change
    return () => {
      cleanupLayers()
    }
  }, [mapInstance, visible, year, opacity, cleanupLayers])

  // Update layer visibility and opacity when props change
  useEffect(() => {
    if (tiffLayerRef.current) {
      tiffLayerRef.current.setVisible(visible)
      tiffLayerRef.current.setOpacity(opacity)
    }
  }, [visible, opacity])

  return null
}
