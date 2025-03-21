import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
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
} from 'recharts'

/* Define the type for the raw district data */
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

interface DistrictReportProps {
  districtData: DistrictDataRow[]
  districtName: string
  region?: string
}

/* Helper function to safely get a number value */
function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

/* Process the raw district data into a format suitable for charts and tables */
function processDistrictData(districtData: DistrictDataRow[]) {
  if (!districtData || districtData.length === 0) {
    return []
  }

  // Group data by year
  const dataByYear = districtData.reduce<Record<number, any>>((acc, item) => {
    const year = item.Year
    if (!acc[year]) {
      acc[year] = {
        year,
        openShrublands: 0,
        grasslands: 0,
        croplands: 0,
        barren: 0,
        unknown: 0,
        precip: safeNumber(item['Precipitation (mm)']),
        gpp: safeNumber(item['GPP (kg_C/m²/year)']),
        popDensity: safeNumber(item['Population Density (People/km²)']),
      }
    }

    // Add land cover percentages based on label
    const label = (item.LandCoverLabel || '').toLowerCase()
    if (label.includes('shrub')) {
      acc[year].openShrublands += item.Percentage
    }
    else if (label.includes('grass')) {
      acc[year].grasslands += item.Percentage
    }
    else if (label.includes('crop')) {
      acc[year].croplands += item.Percentage
    }
    else if (label.includes('barren') || label.includes('sparse')) {
      acc[year].barren += item.Percentage
    }
    else {
      acc[year].unknown += item.Percentage
    }

    return acc
  }, {})

  // Convert to array and sort by year
  return Object.values(dataByYear).sort((a, b) => a.year - b.year)
}

/* Calculate rainfall variability index */
function calculateRainfallVariabilityIndex(processedData: any[]) {
  if (processedData.length < 2)
    return { arvi: 0, min: 0, max: 0, minYear: 0, maxYear: 0, avg: 0 }

  const rainfallValues = processedData.map(d => d.precip).filter(v => v > 0)
  if (rainfallValues.length < 2)
    return { arvi: 0, min: 0, max: 0, minYear: 0, maxYear: 0, avg: 0 }

  const min = Math.min(...rainfallValues)
  const max = Math.max(...rainfallValues)
  const avg = rainfallValues.reduce((sum, val) => sum + val, 0) / rainfallValues.length
  const arvi = (max - min) / avg

  const minYear = processedData.find(d => d.precip === min)?.year || 0
  const maxYear = processedData.find(d => d.precip === max)?.year || 0

  return {
    arvi,
    min,
    max,
    minYear,
    maxYear,
    avg,
  }
}

/* Calculate population trends */
function calculatePopulationTrends(processedData: any[]) {
  if (processedData.length < 2)
    return { change: 0, avgChange: 0, trend: 'steady', years: 0, projectedPopulation: 0 }

  const firstYear = processedData[0]
  const lastYear = processedData[processedData.length - 1]

  const firstPopDensity = firstYear.popDensity
  const lastPopDensity = lastYear.popDensity

  const change = firstPopDensity === 0 ? 0 : ((lastPopDensity - firstPopDensity) / firstPopDensity) * 100

  // Calculate average annual change
  const yearsDiff = lastYear.year - firstYear.year
  const avgChange = yearsDiff > 0 ? change / yearsDiff : 0

  let trend = 'steady'
  if (change > 5)
    trend = 'increased'
  else if (change < -5)
    trend = 'decreased'

  return {
    change,
    avgChange,
    trend,
    years: yearsDiff,
    projectedPopulation: lastPopDensity * (1 + (avgChange / 100) * 5), // Project 5 years into the future
  }
}

/* StackedBar component for visualizing land cover distribution in a table cell */
function StackedBar({ values }: { values: { label: string, value: number, color: string }[] }) {
  const total = values.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className="flex h-4 w-full rounded overflow-hidden border">
      {values.map((item, i) => {
        if (item.value <= 0)
          return null
        const widthPercent = (item.value / total) * 100
        return (
          <div
            key={i}
            style={{ width: `${widthPercent}%`, backgroundColor: item.color }}
            title={`${item.label}: ${item.value.toFixed(2)}%`}
          />
        )
      })}
    </div>
  )
}

/* LandCoverTable component for displaying cleaned, readable data */
export function LandCoverTable({ processedData }: { processedData: any[] }) {
  return (
    <div className="overflow-x-auto mt-8">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2 text-left">Year</th>
            <th className="border p-2 text-left">Open Shrublands</th>
            <th className="border p-2 text-left">Grasslands</th>
            <th className="border p-2 text-left">Croplands</th>
            <th className="border p-2 text-left">Barren Land</th>
            <th className="border p-2 text-left">Other</th>
            <th className="border p-2 text-left">Total (%)</th>
            <th className="border p-2 text-left">Visualization</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((data, index) => {
            const total = data.openShrublands + data.grasslands + data.croplands + data.barren + data.unknown
            const barValues = [
              { label: 'Open Shrublands', value: data.openShrublands, color: '#8884d8' },
              { label: 'Grasslands', value: data.grasslands, color: '#82ca9d' },
              { label: 'Croplands', value: data.croplands, color: '#ff8042' },
              { label: 'Barren Land', value: data.barren, color: '#d3d3d3' },
              { label: 'Other', value: data.unknown, color: '#ffc658' },
            ]
            return (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border p-2">{data.year}</td>
                <td className="border p-2">{data.openShrublands.toFixed(2)}%</td>
                <td className="border p-2">{data.grasslands.toFixed(2)}%</td>
                <td className="border p-2">{data.croplands.toFixed(2)}%</td>
                <td className="border p-2">{data.barren.toFixed(2)}%</td>
                <td className="border p-2">{data.unknown.toFixed(2)}%</td>
                <td className="border p-2">{total.toFixed(2)}%</td>
                <td className="border p-2">
                  <StackedBar values={barValues} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* Main DistrictReport component that integrates charts, tables, and print functionality */
export function DistrictReport({ districtData, districtName, region = 'Sahel' }: DistrictReportProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [selectedDistrict, setSelectedDistrict] = useState(districtName)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['popDensity', 'precip', 'gpp'])
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])

  // Get all available districts from the data
  useMemo(() => {
    const districts = [...new Set(districtData.map(item => item.District))].sort()
    setAvailableDistricts(districts)
    if (!districts.includes(selectedDistrict) && districts.length > 0) {
      setSelectedDistrict(districts[0])
    }
  }, [districtData, selectedDistrict])

  // Filter data for selected district
  const filteredData = useMemo(() => {
    return districtData.filter(item => item.District === selectedDistrict)
  }, [districtData, selectedDistrict])

  const processedData = processDistrictData(filteredData)
  const rainfallStats = calculateRainfallVariabilityIndex(processedData)
  const populationStats = calculatePopulationTrends(processedData)
  const latestYearData = processedData.length > 0 ? processedData[processedData.length - 1] : null
  const yearRange = processedData.length > 0
    ? `${processedData[0].year}-${processedData[processedData.length - 1].year}`
    : 'N/A'

  const handlePrint = useReactToPrint({
    documentTitle: `${selectedDistrict}_District_Report`,
    onAfterPrint: () => console.warn('Printed successfully'),
    contentRef: reportRef,
  })

  // Handle metric selection toggle
  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric],
    )
  }

  return (
    <>
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Select District
            </label>
            <Select
              value={selectedDistrict}
              onValueChange={(value: string) => setSelectedDistrict(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {availableDistricts.map(district => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Select Metrics to Compare
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes('popDensity')}
                  onChange={() => toggleMetric('popDensity')}
                  className="mr-1"
                />
                <span className="text-sm">Population</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes('precip')}
                  onChange={() => toggleMetric('precip')}
                  className="mr-1"
                />
                <span className="text-sm">Precipitation</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes('gpp')}
                  onChange={() => toggleMetric('gpp')}
                  className="mr-1"
                />
                <span className="text-sm">GPP</span>
              </label>
            </div>
          </div>

          <div className="flex items-end">
            <Button onClick={() => handlePrint()} variant="outline">
              Generate PDF Report
            </Button>
          </div>
        </div>

        {/* Metrics Comparison Chart */}
        {processedData.length > 0 && (
          <div className="mt-4 border p-4 rounded-md bg-white">
            <h3 className="text-lg font-bold mb-2 text-center">Metrics Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  {selectedMetrics.includes('popDensity') && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="popDensity"
                      stroke="#8884d8"
                      name="Population Density (People/km²)"
                      strokeWidth={2}
                    />
                  )}
                  {selectedMetrics.includes('precip') && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="precip"
                      stroke="#82ca9d"
                      name="Precipitation (mm)"
                      strokeWidth={2}
                    />
                  )}
                  {selectedMetrics.includes('gpp') && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="gpp"
                      stroke="#ff7300"
                      name="GPP (kg_C/m²/year)"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Printable report content - hidden on screen, visible when printing */}
      <div className="hidden print:block">
        <div ref={reportRef} className="p-8 bg-white max-w-4xl mx-auto">
          {/* G20/UN Cover Page */}
          <div className="text-center mb-12 pb-4 page-break-after">
            <div className="flex justify-center mb-6">
              {/* Use inline SVG instead of external images to avoid loading issues during printing */}
              <div className="h-24 mr-4 flex items-center justify-center">
                <div className="text-2xl font-bold">G20</div>
              </div>
              <div className="h-24 flex items-center justify-center">
                <div className="text-2xl font-bold">UN</div>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              G20 Global Land Initiative
            </h1>
            <h2 className="text-2xl mb-6">
              United Nations Convention to Combat Desertification
            </h2>
            <div className="border-t border-b py-4 max-w-md mx-auto my-8">
              <h3 className="text-3xl font-bold mb-2">District Report</h3>
              <p className="text-xl mb-4">{selectedDistrict}</p>
              <p className="text-gray-500">
                Generated on: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Report Header */}
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold mb-2">
              {selectedDistrict}
              {' '}
              District Report
            </h1>
            <p className="text-xl">
              {region}
              {' '}
              Region Land Cover Analysis
            </p>
            <p className="text-gray-500">
              Data Period:
              {yearRange}
            </p>
          </div>

          {/* Executive Summary */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Executive Summary</h2>
            <div className="border p-4 rounded-md bg-gray-50">
              <p className="mb-2">
                This report provides a comprehensive analysis of land cover changes and environmental trends in
                {' '}
                <span className="font-bold">{selectedDistrict}</span>
                {' '}
                district from
                {' '}
                <span className="font-bold">{yearRange}</span>
                .
              </p>
              <p>
                Key findings include
                {' '}
                <span className="font-bold">{populationStats.change > 5 ? 'significant population growth' : populationStats.change < -5 ? 'population decline' : 'stable population'}</span>
                ,
                {' '}
                <span className="font-bold">{rainfallStats.arvi > 0.3 ? 'high rainfall variability' : rainfallStats.arvi > 0.15 ? 'moderate rainfall variability' : 'stable rainfall patterns'}</span>
                , and
                {' '}
                <span className="font-bold">
                  {latestYearData
                    ? latestYearData.openShrublands > 40
                      ? 'predominant open shrubland coverage'
                      : latestYearData.grasslands > 40
                        ? 'predominant grassland coverage'
                        : latestYearData.croplands > 40
                          ? 'predominant cropland usage'
                          : latestYearData.barren > 40
                            ? 'significant barren land areas'
                            : 'mixed land cover distribution'
                    : 'insufficient data for land cover analysis'}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Land Cover Distribution */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Land Cover Distribution</h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  <Legend />
                  <Bar dataKey="openShrublands" stackId="a" name="Open Shrublands" fill="#8884d8" />
                  <Bar dataKey="grasslands" stackId="a" name="Grasslands" fill="#82ca9d" />
                  <Bar dataKey="croplands" stackId="a" name="Croplands" fill="#ff8042" />
                  <Bar dataKey="barren" stackId="a" name="Barren Land" fill="#d3d3d3" />
                  <Bar dataKey="unknown" stackId="a" name="Other" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Land Cover Table */}
            <LandCoverTable processedData={processedData} />
          </div>

          {/* Environmental Metrics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Environmental Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Rainfall Variability</h3>
                <p className="mb-1">
                  <span className="font-medium">ARVI:</span>
                  {' '}
                  {rainfallStats.arvi.toFixed(2)}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Min:</span>
                  {' '}
                  {rainfallStats.min.toFixed(2)} mm (
                  {rainfallStats.minYear}
                  )
                </p>
                <p className="mb-1">
                  <span className="font-medium">Max:</span>
                  {' '}
                  {rainfallStats.max.toFixed(2)} mm (
                  {rainfallStats.maxYear}
                  )
                </p>
                <p>
                  <span className="font-medium">Avg:</span>
                  {' '}
                  {rainfallStats.avg.toFixed(2)} mm
                </p>
              </div>

              <div className="border p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Population Trends</h3>
                <p className="mb-1">
                  <span className="font-medium">Change:</span>
                  {' '}
                  {populationStats.change.toFixed(2)}%
                </p>
                <p className="mb-1">
                  <span className="font-medium">Annual Change:</span>
                  {' '}
                  {populationStats.avgChange.toFixed(2)}%
                </p>
                <p className="mb-1">
                  <span className="font-medium">Trend:</span>
                  {' '}
                  {populationStats.trend}
                </p>
                <p>
                  <span className="font-medium">Projected (5yr):</span>
                  {' '}
                  {populationStats.projectedPopulation.toFixed(2)} people/km²
                </p>
              </div>

              <div className="border p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Current Land Cover</h3>
                {latestYearData && (
                  <>
                    <p className="mb-1">
                      <span className="font-medium">Open Shrublands:</span>
                      {' '}
                      {latestYearData.openShrublands.toFixed(2)}%
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Grasslands:</span>
                      {' '}
                      {latestYearData.grasslands.toFixed(2)}%
                    </p>
                    <p className="mb-1">
                      <span className="font-medium">Croplands:</span>
                      {' '}
                      {latestYearData.croplands.toFixed(2)}%
                    </p>
                    <p>
                      <span className="font-medium">Barren Land:</span>
                      {' '}
                      {latestYearData.barren.toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Raw Data */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Raw Data</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2 text-left">Year</th>
                    <th className="border p-2 text-left">Precipitation (mm)</th>
                    <th className="border p-2 text-left">GPP (kg_C/m²/year)</th>
                    <th className="border p-2 text-left">Population Density (People/km²)</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((data, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border p-2">{data.year}</td>
                      <td className="border p-2">{data.precip.toFixed(2)}</td>
                      <td className="border p-2">{data.gpp.toFixed(2)}</td>
                      <td className="border p-2">{data.popDensity.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-12 pt-4 border-t">
            <p> {new Date().getFullYear()} G20 Global Land Initiative</p>
            <p>United Nations Convention to Combat Desertification</p>
            <p>For official use only</p>
          </div>
        </div>
      </div>
    </>
  )
}
