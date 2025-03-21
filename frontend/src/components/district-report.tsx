// Add this to your comparison-tools.tsx file or create a new file called district-report.tsx

import { Button } from '@/components/ui/button'
import { useRef } from 'react'
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

// Define the type for the raw district data
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

// Helper function to safely get a number value
function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

// Process the raw district data into a format suitable for charts
function processDistrictData(districtData: DistrictDataRow[]) {
  if (!districtData || districtData.length === 0) {
    return []
  }

  // Extract unique years from the district data
  const _years = [...new Set(districtData.map(item => item.Year))].sort((a, b) => a - b)

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

// Calculate rainfall variability index
function calculateRainfallVariabilityIndex(processedData: any[]) {
  if (processedData.length < 2)
    return { arvi: 0, min: 0, max: 0, minYear: 0, maxYear: 0, avg: 0 }

  const rainfallValues = processedData.map(d => d.precip).filter(v => v > 0)
  if (rainfallValues.length < 2)
    return { arvi: 0, min: 0, max: 0, minYear: 0, maxYear: 0, avg: 0 }

  const min = Math.min(...rainfallValues)
  const max = Math.max(...rainfallValues)
  const avg = rainfallValues.reduce((sum, val) => sum + val, 0) / rainfallValues.length
  const arvi = (max - min) / avg // Annual Rainfall Variability Index

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

// Calculate population trends
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
    projectedPopulation: lastPopDensity * (1 + (avgChange / 100) * 5), // Project 5 years into future
  }
}

export function DistrictReport({ districtData, districtName, region = 'Sahel' }: DistrictReportProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  const processedData = processDistrictData(districtData)
  const rainfallStats = calculateRainfallVariabilityIndex(processedData)
  const populationStats = calculatePopulationTrends(processedData)

  // Latest year data for cover page
  const latestYearData = processedData.length > 0 ? processedData[processedData.length - 1] : null

  // Calculate year range for display
  const yearRange = processedData.length > 0
    ? `${processedData[0].year}-${processedData[processedData.length - 1].year}`
    : 'N/A'

  const handlePrint = useReactToPrint({
    documentTitle: `${districtName}_District_Report`,
    onAfterPrint: () => console.warn('Printed successfully'),
    contentRef: reportRef,
  })

  return (
    <>
      <Button
        onClick={() => handlePrint()}
        className="mb-4"
        variant="outline"
      >
        Generate PDF Report
      </Button>

      <div className="hidden">
        <div ref={reportRef} className="p-4 bg-white">
          {/* Cover Page */}
          <div className="relative h-[297mm] w-[210mm] p-8 flex flex-col" style={{ pageBreakAfter: 'always' }}>
            <div className="absolute inset-0 z-0 opacity-10">
              <img
                src="/background-image.jpg"
                alt="Background"
                className="w-full h-full object-cover"
                style={{ filter: 'brightness(0.9)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <div className="flex justify-between mb-8 z-10">
              <img
                src="/UN_logo.png"
                alt="UN Logo"
                className="h-12"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <img
                src="/G20_logo.png"
                alt="G20 Logo"
                className="h-12"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <div className="flex-grow"></div>

            <div className="z-10 mb-8">
              <h1 className="text-3xl font-bold mb-2">
                District:
                {' '}
                {districtName}
              </h1>
              <h2 className="text-xl mb-4">
                Region:
                {' '}
                {region}
              </h2>
              <p className="text-lg mb-2">
                GPP:
                {' '}
                {latestYearData?.gpp.toFixed(2) || 'N/A'}
                {' '}
                kg C/m³/year
              </p>
              <p className="text-lg">
                Population Density:
                {' '}
                {latestYearData?.popDensity.toFixed(2) || 'N/A'}
                {' '}
                people/km²
              </p>
            </div>
          </div>

          {/* Data Pages */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Population Density Trends */}
              <div>
                <h2 className="text-xl font-bold mb-2">Population Density Trends</h2>
                <p className="text-sm mb-4">
                  Over the past
                  {' '}
                  {processedData.length > 0 ? (processedData[processedData.length - 1].year - processedData[0].year) : 'N/A'}
                  {' '}
                  years, the population has shown
                  {' '}
                  {populationStats.change > 5 ? 'growth' : populationStats.change < -5 ? 'decline' : 'stagnation'}
                  {' '}
                  trends.
                  The annual population change averaged
                  {' '}
                  {populationStats.avgChange.toFixed(2)}
                  % per year,
                  indicating a
                  {' '}
                  {Math.abs(populationStats.avgChange) < 1 ? 'steady' : 'volatile'}
                  {' '}
                  pattern.
                  If trends continue, the district's population is expected to reach
                  {' '}
                  {populationStats.projectedPopulation.toFixed(2)}
                  {' '}
                  by
                  {' '}
                  {new Date().getFullYear() + 5}
                  .
                </p>

                {processedData.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={value => [Number(value).toFixed(2), 'People/km²']} />
                        <Line
                          type="monotone"
                          dataKey="popDensity"
                          stroke="#8884d8"
                          name="Population Density"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Annual Rainfall Variability Index */}
              <div>
                <h2 className="text-xl font-bold mb-2">Annual Rainfall Variability Index</h2>
                <p className="text-sm mb-4">
                  The district received an average annual rainfall of
                  {' '}
                  {rainfallStats.avg.toFixed(2)}
                  {' '}
                  mm over
                  the last
                  {' '}
                  {yearRange}
                  {' '}
                  period. The Annual Rainfall Variability
                  Index (ARVI) is calculated at
                  {' '}
                  {rainfallStats.arvi.toFixed(2)}
                  , indicating
                  {rainfallStats.arvi < 0.2 ? ' low' : rainfallStats.arvi < 0.4 ? ' moderate' : ' high'}
                  {' '}
                  variability.
                  Rainfall ranged from a low of
                  {' '}
                  {rainfallStats.min.toFixed(2)}
                  {' '}
                  mm in
                  {rainfallStats.minYear}
                  {' '}
                  to a high of
                  {' '}
                  {rainfallStats.max.toFixed(2)}
                  {' '}
                  mm in
                  {rainfallStats.maxYear}
                  .
                  High ARVI values correlate with agricultural yield fluctuations, water stress periods, extreme drought/flood events.
                </p>

                {processedData.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={value => [Number(value).toFixed(2), 'mm']} />
                        <Line
                          type="monotone"
                          dataKey="precip"
                          stroke="#82ca9d"
                          name="Precipitation"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Land Cover Distribution */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Land Cover Distribution</h3>
              <div className="flex flex-wrap">
                {processedData.map(data => (
                  <div
                    key={`landcover-year-${data.year}`}
                    className="w-1/2 p-2"
                  >
                    <h4 className="text-lg font-bold mb-2">{data.year}</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[data]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={value => [`${Number(value).toFixed(2)}%`, '']} />
                        <Legend />
                        <Bar dataKey="openShrublands" stackId="a" fill="#8884d8" name="Open Shrublands" />
                        <Bar dataKey="grasslands" stackId="a" fill="#82ca9d" name="Grasslands" />
                        <Bar dataKey="croplands" stackId="a" fill="#ff8042" name="Croplands" />
                        <Bar dataKey="barren" stackId="a" fill="#d3d3d3" name="Barren Land" />
                        <Bar dataKey="unknown" stackId="a" fill="#ffc658" name="Other" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Data Table */}
            <div>
              <h2 className="text-xl font-bold mb-4">Environmental Data Summary</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Year</th>
                    <th className="border p-2 text-left">Precipitation (mm)</th>
                    <th className="border p-2 text-left">GPP (kg_C/m²/year)</th>
                    <th className="border p-2 text-left">Population Density</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((data, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border p-2">{data.year}</td>
                      <td className="border p-2">{data.precip.toFixed(2)}</td>
                      <td className="border p-2">{data.gpp.toFixed(2)}</td>
                      <td className="border p-2">{data.popDensity.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                Generated on
                {' '}
                {new Date().toLocaleDateString()}
              </p>
              <p>G20 Global Land Initiative - United Nations Convention to Combat Desertification</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
