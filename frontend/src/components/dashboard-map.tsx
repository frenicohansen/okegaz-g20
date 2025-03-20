import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMap } from '@/hooks/use-map'
import { Info, Map as MapIcon, Search } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { DistrictProfile } from './district-profile'
import 'ol/ol.css'
import 'ol-layerswitcher/dist/ol-layerswitcher.css'

export const DashboardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const {
    selectedDistrict,
    tiffOpacity,
    setTiffOpacity,
    selectedYear,
    setSelectedYear,
    searchDistrict,
    districtNames,
  } = useMap(mapRef)
  const [districtDataMap, setDistrictDataMap] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false)

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

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.length > 0 && districtNames.length > 0) {
      // Filter district names that match the query
      const filtered = districtNames.filter(name =>
        name.toLowerCase().includes(query.toLowerCase()),
      )
      setSearchResults(filtered.slice(0, 5)) // Limit to 5 results
      setShowSearchResults(true)
    }
    else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery) {
      searchDistrict(searchQuery)
      setShowSearchResults(false)
    }
  }

  // Handle search result selection
  const handleSelectSearchResult = (name: string) => {
    setSearchQuery(name)
    searchDistrict(name)
    setShowSearchResults(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          {/* Search bar positioned on top of the map */}
          <div className="absolute top-2 left-2 right-2 z-10">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search for a district..."
                  className="w-full px-4 py-2 pl-9 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>

                {/* Search results dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20">
                    <ul>
                      {searchResults.map((name, index) => (
                        <li
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectSearchResult(name)}
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </form>
          </div>

          <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-gray-200"></div>
          {/* Map controls will be rendered directly on the map by OpenLayers */}
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
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">About Assaba</h3>
                  <p className="text-sm">
                    Assaba is a region in southern Mauritania. This dashboard visualizes
                    districts, roads, and water bodies in the region using GeoJSON data.
                  </p>
                </div>

                <div className="flex flex-col gap-8">
                  <h3 className="text-lg font-semibold mb-2">Opacity Control</h3>

                  <div className="space-y-4 min-w-[300px]">
                    <Label>Layer Opacity</Label>
                    <div>
                      <span
                        className="mb-3 flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground"
                        aria-hidden="true"
                      >
                        <span>Low</span>
                        <span>High</span>
                      </span>
                      <Slider
                        defaultValue={[0.5]}
                        min={0}
                        max={1}
                        step={0.1}
                        aria-label="Layer opacity slider"
                        value={[tiffOpacity]}
                        onValueChange={value => setTiffOpacity(value[0])}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 min-w-[300px]">
                    <Label>
                      Select year:
                      {' '}
                      {selectedYear}
                    </Label>
                    <div>
                      <span
                        className="mb-3 flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground"
                        aria-hidden="true"
                      >
                        <span>2010</span>
                        <span>2023</span>
                      </span>
                      <Slider
                        min={2010}
                        max={2023}
                        step={1}
                        value={[selectedYear]}
                        onValueChange={value => setSelectedYear(value[0])}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
