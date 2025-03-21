// dashboard-map.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMap } from "@/hooks/use-map";
import { Info, Map as MapIcon } from "lucide-react";
import React, { useEffect, useRef, useState, useContext } from "react";
import { DistrictDetail } from "./district-details";
import { DistrictProfile } from "./district-profile";
import { SearchDistrict } from "./search-district";
import { AreaChartInteractive } from "./charts/area-chart";
import { DataContext } from "@/context/DataContext";
/**
 * Transform an array of DistrictDataRow for a single district
 * into the ChartData array used by the Recharts <AreaChart />.
 */
import type { DistrictDataRow } from "@/context/DataContext"; // adapt path for your project

import "ol/ol.css";
import "ol-layerswitcher/dist/ol-layerswitcher.css";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
};

export const DashboardMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const {
    scenarios,
    selectedDistrict,
    selectedScenario,
    setSelectedScenario,
    searchDistrict,
    districtNames,
    selectedYear,
    setSelectedYear,
  } = useMap(mapRef);

  const dataContext = useContext(DataContext);

  if (!dataContext) {
    console.error("DataContext is undefined");
    return null;
  }

  const { memoizedDistrictRows } = dataContext;

  const [districtDataMap, setDistrictDataMap] = useState<Record<string, any[]>>(
    {}
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load district data from JSON file
  useEffect(() => {
    const loadDistrictData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/district_data.json");
        if (!response.ok) {
          throw new Error("Failed to load district data");
        }
        const data = await response.json();
        setDistrictDataMap(data);
      } catch (error) {
        console.error("Error loading district data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDistrictData();
  }, []);

  // 3. Provide your chart config (colors, labels, etc.)
  const chartConfig = {
    visitors: { label: "Visitors" },
    desktop: {
      label: "Precip (mm)",
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: "GPP",
      color: "hsl(var(--chart-2))",
    },
  };

  // Get the district name from the selected feature
  const getDistrictName = (): string | null => {
    if (!selectedDistrict) return null;

    // Try to get the district name from properties
    if (selectedDistrict.properties && selectedDistrict.properties.ADM3_EN) {
      return selectedDistrict.properties.ADM3_EN;
    }

    // If not found in properties, check if it's directly on the feature
    if (selectedDistrict.ADM3_EN) {
      return selectedDistrict.ADM3_EN;
    }

    return null;
  };

  const districtName = getDistrictName();
  const districtData =
    districtName && districtDataMap[districtName]
      ? districtDataMap[districtName]
      : [];

  // Set initial selected year when district changes
  useEffect(() => {
    if (districtData && districtData.length > 0) {
      // Find the most recent year in the data
      const years = districtData.map((item) => item.Year);
      const mostRecentYear = Math.max(...years);
      setSelectedYear(mostRecentYear);
    }
  }, [districtData, setSelectedYear]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col md:flex-row h-full">
        {/* Map Container - Reduced size for better UI balance */}
        <div className="w-full md:w-1/2 lg:w-3/5 h-[40vh] md:h-full relative  rounded-md">
          <div ref={mapRef} className="w-full h-[60%]" />

          <div className="absolute top-4 left-4 z-10 bg-white rounded-md shadow-md p-2 max-w-xs">
            <SearchDistrict
              districts={districtNames.map((district) => ({
                value: district,
                label: district,
              }))}
              value={districtName || ""}
              onSelect={searchDistrict}
            />
          </div>
          <div className="bg-white">
            <AreaChartInteractive
              chartConfig={chartConfig}
              chartData={memoizedDistrictRows}
              selectedScenario={selectedScenario}
            />
          </div>
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
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-1"
                >
                  <MapIcon className="h-4 w-4" />
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="info"
                className="p-4 h-[calc(100vh-350px)] overflow-auto"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Loading district data...
                  </div>
                ) : districtName && districtData.length > 0 ? (
                  <DistrictProfile
                    districtName={districtName}
                    districtData={districtData}
                    selectedYear={selectedYear}
                    selectedScenario={selectedScenario}
                    setSelectedScenario={setSelectedScenario}
                    onYearChange={setSelectedYear}
                    scenarios={scenarios}
                  />
                ) : selectedDistrict ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedDistrict.ADM3_EN ?? "Feature Info"}
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(selectedDistrict.properties || {}).map(
                        ([key, value]) => (
                          <div key={key} className="grid grid-cols-2">
                            <span className="font-medium">{key}:</span>
                            <span>{value?.toString() || "N/A"}</span>
                          </div>
                        )
                      )}
                    </div>
                    {districtName && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-700">
                          No detailed data available for district:{" "}
                          {districtName}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Click on a district to see details
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="details"
                className="p-4 h-[calc(100vh-350px)] overflow-auto"
              >
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
  );
};
