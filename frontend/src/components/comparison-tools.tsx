import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSelectedDistricts } from '@/hooks/use-selected-districts'
import { X } from 'lucide-react'
// src/components/comparison-tools.tsx
import { useRef, useState } from 'react'
// For printing
import { useReactToPrint } from 'react-to-print'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DistrictReport } from './district-report'

// Types for metrics
type MetricType = 'precip' | 'gpp' | 'popDensity'

const metricLabels: Record<MetricType, string> = {
  precip: 'Precipitation (mm)',
  gpp: 'GPP (kg_C/m²/year)',
  popDensity: 'Population Density (People/km²)',
}

export function ComparisonTools() {
  const {
    selectedDistricts,
    availableDistricts,
    isLoading,
    addDistrict,
    removeDistrict,
    clearDistricts,
  } = useSelectedDistricts()

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('precip')

  // For printing
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    documentTitle: 'District Comparison',
    onPrintError: error => console.error('Print failed:', error),
    onAfterPrint: () => console.warn('Printed successfully'),
    contentRef: printRef,
  })

  // Merge district data for the selected metric
  const mergedData = mergeDistrictData(selectedDistricts, selectedMetric)

  // Transform data for DistrictReport component
  const transformDataForReport = (
    data: Record<string, number | number[]>[],
    districtName: string,
  ): any[] => {
    if (!data.length || !selectedDistricts.length)
      return []

    // Find the selected district's data
    const districtData = selectedDistricts.find(d => d.districtName === districtName)
    if (!districtData)
      return []

    // Return the original district data which matches the expected format
    return districtData.data
  }

  return (
    <div ref={printRef} className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Compare & Analyze</h2>
      <p className="text-muted-foreground">
        Select multiple districts or metrics to compare time-series data.
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        {/* District Selection */}
        <div className="flex-1">
          <label className="text-sm font-medium">Add District</label>
          <Select
            disabled={isLoading}
            onValueChange={addDistrict}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {availableDistricts.map(district => (
                <SelectItem
                  key={district}
                  value={district}
                  disabled={selectedDistricts.some(d => d.districtName === district)}
                >
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric Selection */}
        <div className="flex-1">
          <label className="text-sm font-medium">Select Metric</label>
          <Select
            value={selectedMetric}
            onValueChange={value => setSelectedMetric(value as MetricType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="precip">Precipitation (mm)</SelectItem>
              <SelectItem value="gpp">GPP (kg_C/m²/year)</SelectItem>
              <SelectItem value="popDensity">Population Density (People/km²)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDistricts.length > 0 && mergedData.length > 0 && (
        <DistrictReport
          districtData={transformDataForReport(mergedData, selectedDistricts[0]?.districtName || '')}
          districtName={selectedDistricts[0]?.districtName || ''}
        />
      )}

      {/* Selected Districts */}
      {selectedDistricts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDistricts.map(district => (
            <Badge key={district.districtName} variant="secondary" className="flex items-center gap-1">
              {district.districtName}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeDistrict(district.districtName)}
              />
            </Badge>
          ))}
          {selectedDistricts.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearDistricts}
            >
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {metricLabels[selectedMetric]}
            {' '}
            Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDistricts.length === 0
            ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select at least one district to see comparison data
                </div>
              )
            : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mergedData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toFixed(2) : value,
                        name,
                      ]}
                    />
                    <Legend />
                    {selectedDistricts.map(dist => (
                      <Line
                        key={dist.districtName}
                        type="monotone"
                        dataKey={dist.districtName}
                        name={dist.districtName}
                        stroke={getRandomColor(dist.districtName)}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      {selectedDistricts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border">District</th>
                  <th className="text-left p-2 border">Min</th>
                  <th className="text-left p-2 border">Max</th>
                  <th className="text-left p-2 border">Average</th>
                </tr>
              </thead>
              <tbody>
                {selectedDistricts.map((district) => {
                  const stats = calculateStats(district.data, selectedMetric)
                  return (
                    <tr key={district.districtName}>
                      <td className="p-2 border">{district.districtName}</td>
                      <td className="p-2 border">{stats.min.toFixed(2)}</td>
                      <td className="p-2 border">{stats.max.toFixed(2)}</td>
                      <td className="p-2 border">{stats.avg.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => handlePrint()}
        className="bg-blue-600 text-white print:hidden" // Hide button when printing
        disabled={selectedDistricts.length === 0}
      >
        Print / Export
      </Button>

      {/* Print-only header */}
      <div className="hidden print:block print:mb-4">
        <h3 className="text-lg font-semibold">G20 Global Land Initiative - District Comparison</h3>
        <p>
          Printed on:
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

// Helper function to merge data from multiple districts into a single array
function mergeDistrictData(
  selectedDistricts: {
    districtName: string
    data: Array<{
      'Year': number
      'Precipitation (mm)': number | null
      'GPP (kg_C/m²/year)': number | null
      'Population Density (People/km²)': number | null
      [k: string]: any
    }>
  }[],
  metric: MetricType,
) {
  // Map metric to the corresponding field in the data
  const metricMap: Record<MetricType, string> = {
    precip: 'Precipitation (mm)',
    gpp: 'GPP (kg_C/m²/year)',
    popDensity: 'Population Density (People/km²)',
  }

  // 1) Collect all unique years
  const allYears = new Set<number>()
  selectedDistricts.forEach((dist) => {
    dist.data.forEach(row => allYears.add(row.Year))
  })

  // 2) Build an array of { year, DistrictA: value, DistrictB: value, ... }
  const merged: Record<number, Record<string, number | number[]>> = {}

  selectedDistricts.forEach((dist) => {
    // Group data by year for this district
    const districtDataByYear: Record<number, number> = {}

    // For each year, take the first non-null value of the metric
    // (since the same values are repeated for different land cover classes)
    dist.data.forEach((row) => {
      const year = row.Year
      const metricValue = row[metricMap[metric]]

      if (metricValue !== null && !districtDataByYear[year]) {
        districtDataByYear[year] = Number(metricValue)
      }
    })

    // Add the district's data to the merged object
    Object.entries(districtDataByYear).forEach(([year, value]) => {
      const yearNum = Number(year)
      if (!merged[yearNum]) {
        merged[yearNum] = { year: yearNum }
      }
      merged[yearNum][dist.districtName] = value
    })
  })

  // Convert merged object to array sorted by year
  return Object.values(merged).sort((a: any, b: any) => a.year - b.year)
}

// Helper function to calculate statistics for a district's data
function calculateStats(data: any[], metric: MetricType) {
  const metricMap: Record<MetricType, string> = {
    precip: 'Precipitation (mm)',
    gpp: 'GPP (kg_C/m²/year)',
    popDensity: 'Population Density (People/km²)',
  }

  // Extract unique values for the metric (one per year)
  const uniqueYearValues = new Map<number, number>()

  data.forEach((item) => {
    const year = item.Year
    const value = item[metricMap[metric]]

    if (value !== null && !uniqueYearValues.has(year)) {
      uniqueYearValues.set(year, Number(value))
    }
  })

  const values = Array.from(uniqueYearValues.values())

  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const sum = values.reduce((acc, val) => acc + val, 0)
  const avg = sum / values.length

  return { min, max, avg }
}

// Helper function to pick a consistent color for each district
function getRandomColor(districtName: string) {
  const colors = ['#8884d8', '#82ca9d', '#ff7300', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#00C49F']

  // Hash the districtName to get a consistent index
  let hash = 0
  for (let i = 0; i < districtName.length; i++) {
    hash = districtName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}
