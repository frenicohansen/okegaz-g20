// src/hooks/use-selected-districts.ts
import { useEffect, useState } from 'react'

// Define the type for the raw district data from district_data.json
interface DistrictDataRow {
  'Year': number
  'District': string
  'LandCoverClass': number
  'PixelCount': number
  'Percentage': number
  'LandCoverLabel': string | null
  'Precipitation (mm)': number | null
  'GPP (kg_C/m²/year)': number | null
  'Population Density (People/km²)': number | null
}

// Define the type for a selected district with its data
export interface SelectedDistrict {
  districtName: string
  data: DistrictDataRow[]
}

export function useSelectedDistricts() {
  const [selectedDistricts, setSelectedDistricts] = useState<SelectedDistrict[]>([])
  const [districtDataMap, setDistrictDataMap] = useState<Record<string, DistrictDataRow[]>>({})
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Load district data from JSON file
  useEffect(() => {
    const loadDistrictData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/district_data.json')
        if (!response.ok) {
          throw new Error('Failed to load district data')
        }
        const data = await response.json()
        setDistrictDataMap(data)
        setAvailableDistricts(Object.keys(data))
      }
      catch (error) {
        console.error('Error loading district data:', error)
      }
      finally {
        setIsLoading(false)
      }
    }

    loadDistrictData()
  }, [])

  // Add a district to the comparison
  const addDistrict = (districtName: string) => {
    if (!districtDataMap[districtName])
      return

    // Check if district is already selected
    if (selectedDistricts.some(d => d.districtName === districtName))
      return

    setSelectedDistricts(prev => [
      ...prev,
      {
        districtName,
        data: districtDataMap[districtName],
      },
    ])
  }

  // Remove a district from the comparison
  const removeDistrict = (districtName: string) => {
    setSelectedDistricts(prev => prev.filter(d => d.districtName !== districtName))
  }

  // Clear all selected districts
  const clearDistricts = () => {
    setSelectedDistricts([])
  }

  return {
    selectedDistricts,
    availableDistricts,
    isLoading,
    addDistrict,
    removeDistrict,
    clearDistricts,
  }
}
