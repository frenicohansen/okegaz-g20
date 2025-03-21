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
import { useRef, useState } from 'react'
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
    documentTitle: 'District Comparison Report',
    onPrintError: error => console.error('Print failed:', error),
    onAfterPrint: () => console.warn('Printed successfully'),
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-break-inside-avoid {
          break-inside: avoid;
        }
      }
    `,
  })

  // Merge district data for the selected metric
  const mergedData = mergeDistrictData(selectedDistricts, selectedMetric)

  // Transform data for DistrictReport component
  function transformDataForReport(data: any[]): any[] {
    if (!data || data.length === 0) {
      return []
    }

    // The district data might be in different formats depending on the source
    // Check if the data already has the expected structure
    const firstItem = data[0]

    // If data already has the expected structure, return it as is
    if (
      'Year' in firstItem
      && 'District' in firstItem
      && 'LandCoverClass' in firstItem
      && 'Percentage' in firstItem
    ) {
      return data
    }

    // Otherwise, transform the data to match the expected format
    return data.map(item => ({
      'Year': item.Year || item.year,
      'District': item.District || item.district,
      'LandCoverClass': item.LandCoverClass || 0,
      'PixelCount': item.PixelCount || 0,
      'Percentage': item.Percentage || 0,
      'LandCoverLabel': item.LandCoverLabel || null,
      'Precipitation (mm)': item['Precipitation (mm)'] || item.precip || null,
      'GPP (kg_C/m²/year)': item['GPP (kg_C/m²/year)'] || item.gpp || null,
      'Population Density (People/km²)': item['Population Density (People/km²)'] || item.popDensity || null,
    }))
  }

  return (
    <div className="p-4 space-y-4" ref={printRef}>
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

        {/* Metric Selection for Chart */}
        <div className="flex-1">
          <label className="text-sm font-medium">Chart Metric</label>
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
      <Card className="print-break-inside-avoid mb-8">
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

      {/* District Report Section */}
      {selectedDistricts.length > 0 && (
        <div className="print-break-inside-avoid mb-8">
          <DistrictReport
            districtData={transformDataForReport(selectedDistricts[0].data)}
            districtName={selectedDistricts[0].districtName}
          />
        </div>
      )}

      {/* Print-only header */}
      <div className="hidden print:block print:mb-8">
        <h1 className="text-2xl font-bold mb-2">G20 Global Land Initiative - District Comparison Report</h1>
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <p className="text-sm">
            Generated on:
            {' '}
            {new Date().toLocaleDateString()}
            {' '}
            {new Date().toLocaleTimeString()}
          </p>
          <p className="text-sm">
            Districts:
            {' '}
            {selectedDistricts.map(d => d.districtName).join(', ')}
          </p>
        </div>
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
