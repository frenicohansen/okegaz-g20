import { DistrictProfile } from '@/components/district-profile'
import { MapPanel } from '@/components/map/panel'
import { SearchDistrict } from '@/components/search-district'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMap } from '@/hooks/use-map'
import { Info, Map as MapIcon } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { DistrictDetail } from './district-details'
import 'ol/ol.css'

export const DashboardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const {
    selectedDistrict,
    searchDistrict,
    districtNames,
    layers,
    toggleLayerVisibility,
    selectedYear,
    setSelectedYear,
  } = useMap(mapRef)
  const [districtDataMap, setDistrictDataMap] = useState<Record<string, any[]>>({})
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

  // Get the district name from the selected feature
  const getDistrictName = (): string | null => {
    if (!selectedDistrict)
      return null

    // Try to get the district name from properties
    if (selectedDistrict.properties && selectedDistrict.properties.ADM3_EN) {
      return selectedDistrict.properties.ADM3_EN
    }

    // If not found in properties, check if it's directly on the feature
    if (selectedDistrict.ADM3_EN) {
      return selectedDistrict.ADM3_EN
    }

    return null
  }

  const districtName = getDistrictName()
  const districtData = districtName && districtDataMap[districtName] ? districtDataMap[districtName] : []

  // Set initial selected year when district changes
  useEffect(() => {
    if (districtData && districtData.length > 0) {
      // Find the most recent year in the data
      const years = districtData.map(item => item.Year)
      const mostRecentYear = Math.max(...years)
      setSelectedYear(mostRecentYear)
    }
  }, [districtData, setSelectedYear])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          {/* Search bar positioned on top of the map */}
          <div className="absolute top-2 left-2 right-2 z-10">
            <SearchDistrict districts={districtNames.map(name => ({ value: name, label: name }))} onSelect={searchDistrict} value={getDistrictName() ?? ''} />
          </div>

          <MapPanel layers={layers} toggleLayer={toggleLayerVisibility} />
          <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200"></div>
        </div>

        {/* Details Panel - Increased size for better visibility */}
        <div className="w-full md:w-1/2 lg:w-2/5 h-[60vh] md:h-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="info" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="info" className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  District Info
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <MapIcon className="h-4 w-4" />
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="p-4 h-[calc(100vh-350px)] overflow-auto">
                {isLoading
                  ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Loading district data...
                      </div>
                    )
                  : districtName && districtData.length > 0
                    ? (
                        <DistrictProfile
                          districtName={districtName}
                          districtData={districtData}
                          selectedYear={selectedYear}
                          onYearChange={setSelectedYear}
                        />
                      )
                    : selectedDistrict
                      ? (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">
                              {selectedDistrict.ADM3_EN ?? 'Feature Info'}
                            </h3>
                            <div className="space-y-2">
                              {Object.entries(selectedDistrict.properties || {}).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-2">
                                  <span className="font-medium">
                                    {key}
                                    :
                                  </span>
                                  <span>{value?.toString() || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                            {districtName && (
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-700">
                                  No detailed data available for district:
                                  {' '}
                                  {districtName}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            Click on a district to see details
                          </div>
                        )}
              </TabsContent>
              <TabsContent value="details" className="p-4 h-[calc(100vh-350px)] overflow-auto">
                <DistrictDetail
                  districtData={districtData}
                  districtName={districtName}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
