// Shadcn UI components (using your own implementations; see for example your card.tsx and table.tsx in the repository :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1})
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useData } from "@/context/DataContext";

// Define the type for the raw district data from district_data.json
interface DistrictDataRow {
  Year: number;
  District: string;
  LandCoverClass: number;
  PixelCount: number;
  Percentage: number;
  LandCoverLabel: string | null;
  "Precipitation (mm)": number | null;
  "GPP (kg_C/m²/year)": number | null;
  "Population Density (People/km²)": number | null;
}

// Define the type for processed data we'll use in charts
interface ProcessedDistrictData {
  year: number;
  openShrublands: number;
  grasslands: number;
  croplands: number;
  barren: number;
  unknown: number;
  precip: number;
  gpp: number;
  popDensity: number;
  isSelected: boolean;
}

interface DistrictDetailProps {
  districtData: DistrictDataRow[];
  districtName: string | null;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

// Helper function to safely get a number value
function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0;
  }
  return Number(value);
}

export function DistrictDetail({
  districtData,
  districtName,
  onYearChange,
}: DistrictDetailProps) {
  const { selectedYear, groupedData, setSelectedYear } = useData();
  const [processedData, setProcessedData] = useState<ProcessedDistrictData[]>(
    []
  );
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Process the raw district data into a format suitable for charts
  useEffect(() => {
    if (!districtData || districtData.length === 0) {
      setProcessedData([]);
      setAvailableYears([]);
      return;
    }

    // Extract unique years from the district data
    const years = [...new Set(districtData.map((item) => item.Year))].sort(
      (a, b) => a - b
    );
    setAvailableYears(years);

    // Group data by year
    const dataByYear = districtData.reduce<Record<number, any>>((acc, item) => {
      const year = item.Year;
      if (!acc[year]) {
        acc[year] = {
          year,
          openShrublands: 0,
          grasslands: 0,
          croplands: 0,
          barren: 0,
          unknown: 0,
          precip: safeNumber(item["Precipitation (mm)"]),
          gpp: safeNumber(item["GPP (kg_C/m²/year)"]),
          popDensity: safeNumber(item["Population Density (People/km²)"]),
          isSelected: selectedYear === year,
        };
      }

      // Add land cover percentages based on label
      const label = (item.LandCoverLabel || "").toLowerCase();
      if (label.includes("shrub")) {
        acc[year].openShrublands += item.Percentage;
      } else if (label.includes("grass")) {
        acc[year].grasslands += item.Percentage;
      } else if (label.includes("crop")) {
        acc[year].croplands += item.Percentage;
      } else if (label.includes("barren") || label.includes("sparse")) {
        acc[year].barren += item.Percentage;
      } else {
        acc[year].unknown += item.Percentage;
      }

      return acc;
    }, {});

    // Convert to array and sort by year
    const processed = Object.values(dataByYear).sort((a, b) => a.year - b.year);
    setProcessedData(processed);
  }, [districtData, selectedYear]);

  // Filter data based on the selected year
  const filteredData = selectedYear
    ? processedData.filter((item) => item.year === selectedYear)
    : processedData;

  // Filter raw data based on the selected year
  const filteredRawData = selectedYear
    ? districtData.filter((item) => item.Year === selectedYear)
    : districtData;


  if (!districtName) {
    return (
      <div className="p-4 space-y-6">
        <h2 className="text-2xl font-bold">District Details</h2>
        <p className="text-muted-foreground">
          Please select a district on the map to view detailed information.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">
        {districtName} District Details
        {selectedYear && ` (${selectedYear})`}
      </h2>
      <p className="text-muted-foreground">
        This section shows an informative visual breakdown of land cover and
        environmental metrics over time, followed by the raw data.
      </p>

      {processedData.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p>
              No data available for this district. Please select another
              district.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Land Cover Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                Land Cover Distribution
                {selectedYear ? `(${selectedYear})` : "Over Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number" ? `${value.toFixed(2)}%` : value
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="openShrublands"
                    fill="#8884d8"
                    name="Open Shrublands (%)"
                  />
                  <Bar
                    dataKey="grasslands"
                    fill="#82ca9d"
                    name="Grasslands (%)"
                  />
                  <Bar
                    dataKey="croplands"
                    fill="#ff8042"
                    name="Croplands (%)"
                  />
                  <Bar dataKey="barren" fill="#d3d3d3" name="Barren Land (%)" />
                  <Bar dataKey="unknown" fill="#ffc658" name="Other (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Environmental Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                Environmental Metrics
                {selectedYear ? `(${selectedYear})` : "Over Time"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={filteredData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number" ? value.toFixed(2) : value
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precip"
                    stroke="#8884d8"
                    name="Precipitation (mm)"
                  />
                  <Line
                    type="monotone"
                    dataKey="gpp"
                    stroke="#82ca9d"
                    name="GPP (kg_C/m²/year)"
                  />
                  <Line
                    type="monotone"
                    dataKey="popDensity"
                    stroke="#ff7300"
                    name="Population Density (People/km²)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Raw Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Raw Data
                {selectedYear ? `(${selectedYear})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <tr>
                      <TableCell>Year</TableCell>
                      <TableCell>Land Cover</TableCell>
                      <TableCell>Percentage</TableCell>
                      <TableCell>Precipitation (mm)</TableCell>
                      <TableCell>GPP (kg_C/m²/year)</TableCell>
                      <TableCell>Population Density</TableCell>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredRawData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.Year}</TableCell>
                        <TableCell>
                          {row.LandCoverLabel || `Class ${row.LandCoverClass}`}
                        </TableCell>
                        <TableCell>{row.Percentage.toFixed(2)}%</TableCell>
                        <TableCell>
                          {row["Precipitation (mm)"]?.toFixed(2) || "N/A"}
                        </TableCell>
                        <TableCell>
                          {row["GPP (kg_C/m²/year)"]?.toFixed(2) || "N/A"}
                        </TableCell>
                        <TableCell>
                          {row["Population Density (People/km²)"]?.toFixed(2) ||
                            "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
