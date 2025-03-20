/* eslint-disable react-hooks/rules-of-hooks */
'use client'

import type { ChartConfig } from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import React, { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// The shape of each row in your JSON array
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

interface DistrictProfileProps {
  districtName: string
  districtData: DistrictDataRow[]
}

// Helper function to safely get a number value
function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0
  }
  return Number(value)
}

export function DistrictProfile({ districtName, districtData }: DistrictProfileProps) {
  const [activeMetric, setActiveMetric] = useState<'precipitation' | 'gpp' | 'population'>('precipitation')

  if (!districtData || districtData.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold">{districtName}</h2>
        <p>No data available.</p>
      </div>
    )
  }

  // Sort data by year (ascending)
  const sorted = [...districtData].sort((a, b) => safeNumber(a.Year) - safeNumber(b.Year))

  // Get the latest year for summary stats
  const latestYear = Math.max(...sorted.map(d => safeNumber(d.Year)))
  const latestRows = sorted.filter(d => safeNumber(d.Year) === latestYear)
  const summaryRow = latestRows[0]

  // Process data for land cover distribution chart
  const yearCoverMap: Record<number, Record<string, number>> = {}
  for (const row of sorted) {
    const year = safeNumber(row.Year)
    const label = row.LandCoverLabel || 'Unknown'
    const percentage = safeNumber(row.Percentage)

    if (!yearCoverMap[year]) {
      yearCoverMap[year] = {}
    }

    if (!yearCoverMap[year][label]) {
      yearCoverMap[year][label] = 0
    }

    yearCoverMap[year][label] += percentage
  }

  const landCoverChartData = Object.entries(yearCoverMap).map(([yearStr, labelMap]) => {
    const yearNum = Number(yearStr)
    return {
      year: yearNum,
      ...labelMap,
    }
  })

  // Get all distinct land cover labels
  const allLabels = new Set<string>()
  for (const y of Object.values(yearCoverMap)) {
    for (const label of Object.keys(y)) {
      allLabels.add(label)
    }
  }
  const labelList = Array.from(allLabels)

  // Process data for time series charts (precipitation, GPP, population)
  const timeSeriesData = useMemo(() => {
    // Group by year and compute averages
    const yearData: Record<number, {
      precipitation: number
      gpp: number
      population: number
      count: number
    }> = {}

    for (const row of sorted) {
      const year = safeNumber(row.Year)
      if (!yearData[year]) {
        yearData[year] = {
          precipitation: 0,
          gpp: 0,
          population: 0,
          count: 0,
        }
      }

      // Only add values that are not null/undefined/NaN
      const precip = safeNumber(row['Precipitation (mm)'])
      const gpp = safeNumber(row['GPP (kg_C/m²/year)'])
      const pop = safeNumber(row['Population Density (People/km²)'])

      if (precip > 0) {
        yearData[year].precipitation += precip
        yearData[year].count += 1
      }

      if (gpp > 0) {
        yearData[year].gpp += gpp
      }

      if (pop > 0) {
        yearData[year].population += pop
      }
    }

    // Calculate averages and format for chart
    return Object.entries(yearData)
      .map(([year, data]) => {
        const count = Math.max(1, data.count) // Avoid division by zero
        return {
          year: Number(year),
          precipitation: data.precipitation / count,
          gpp: data.gpp / count,
          population: data.population / count,
        }
      })
      .sort((a, b) => a.year - b.year)
  }, [sorted])

  // Calculate totals for metrics
  const totals = useMemo(() => {
    const result = {
      precipitation: 0,
      gpp: 0,
      population: 0,
    }

    if (timeSeriesData.length === 0) {
      return result
    }

    return {
      precipitation: timeSeriesData.reduce((sum, item) => sum + (item.precipitation || 0), 0),
      gpp: timeSeriesData.reduce((sum, item) => sum + (item.gpp || 0), 0),
      population: timeSeriesData.reduce((sum, item) => sum + (item.population || 0), 0),
    }
  }, [timeSeriesData])

  // Chart configurations
  const chartConfig = {
    precipitation: {
      label: 'Precipitation',
      color: 'hsl(var(--chart-1))',
    },
    gpp: {
      label: 'GPP',
      color: 'hsl(var(--chart-2))',
    },
    population: {
      label: 'Population Density',
      color: 'hsl(var(--chart-3))',
    },
  }

  // Format values for display
  const formatValue = (value: number, metric: string) => {
    // Handle NaN or invalid values
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 'N/A'
    }

    switch (metric) {
      case 'precipitation':
        return `${value.toFixed(2)} mm`
      case 'gpp':
        return `${value.toFixed(2)} kg C/m²/yr`
      case 'population':
        return `${value.toFixed(2)} ppl/km²`
      default:
        return value.toFixed(2)
    }
  }

  // Calculate average for display
  const getAverage = (total: number) => {
    const count = timeSeriesData.length || 1 // Avoid division by zero
    return total / count
  }

  return (
    <div className="p-4 overflow-y-auto space-y-6" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {/* District Title */}
      <h2 className="text-xl font-bold">{districtName}</h2>

      {/* Summary Stats Card */}
      {summaryRow && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Latest Data (
              {safeNumber(summaryRow.Year)}
              )
            </CardTitle>
            <CardDescription>Key environmental and demographic metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Precipitation</span>
                <span className="text-lg font-bold">
                  {safeNumber(summaryRow['Precipitation (mm)']).toFixed(1)}
                  {' '}
                  mm
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">GPP</span>
                <span className="text-lg font-bold">
                  {safeNumber(summaryRow['GPP (kg_C/m²/year)']).toFixed(1)}
                  {' '}
                  kg C/m²/yr
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Population</span>
                <span className="text-lg font-bold">
                  {safeNumber(summaryRow['Population Density (People/km²)']).toFixed(1)}
                  {' '}
                  ppl/km²
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Series Chart */}
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Environmental Metrics Over Time</CardTitle>
            <CardDescription>
              Tracking changes in key metrics over the years
            </CardDescription>
          </div>
          <div className="flex">
            {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map(key => (
              <button
                key={key}
                data-active={activeMetric === key}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveMetric(key)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[key].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-2xl">
                  {formatValue(getAverage(totals[key]), key)}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    if (activeMetric === 'precipitation')
                      return `${value} mm`
                    if (activeMetric === 'gpp')
                      return `${value}`
                    return `${value}`
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === activeMetric) {
                      return [formatValue(Number(value), activeMetric), chartConfig[activeMetric as keyof typeof chartConfig].label]
                    }
                    return ['', '']
                  }}
                  labelFormatter={value => `Year: ${value}`}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  fill={chartConfig[activeMetric].color}
                  fillOpacity={0.3}
                  stroke={chartConfig[activeMetric].color}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={chartConfig[activeMetric].color}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Land Cover Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Land Cover Distribution</CardTitle>
          <CardDescription>Changes in land cover types over the years</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={landCoverChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={value => `${value}%`} />
                <Tooltip
                  formatter={(value, name) => {
                    const numValue = Number(value)
                    return [Number.isNaN(numValue) ? 'N/A' : `${numValue.toFixed(2)}%`, name]
                  }}
                  labelFormatter={value => `Year: ${value}`}
                />
                <Legend />
                {labelList.map(label => (
                  <Bar
                    key={label}
                    dataKey={label}
                    stackId="landcover"
                    fill={randomColorForLabel(label)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Optional: Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>
            Complete dataset for
            {' '}
            {districtName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Year</th>
                  <th className="p-2 text-left font-medium">Land Cover</th>
                  <th className="p-2 text-left font-medium">%</th>
                  <th className="p-2 text-left font-medium">Precip (mm)</th>
                  <th className="p-2 text-left font-medium">GPP</th>
                  <th className="p-2 text-left font-medium">Pop Density</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{row.Year}</td>
                    <td className="p-2">{row.LandCoverLabel || 'Unknown'}</td>
                    <td className="p-2">
                      {safeNumber(row.Percentage).toFixed(2)}
                      %
                    </td>
                    <td className="p-2">{safeNumber(row['Precipitation (mm)']).toFixed(2)}</td>
                    <td className="p-2">{safeNumber(row['GPP (kg_C/m²/year)']).toFixed(2)}</td>
                    <td className="p-2">{safeNumber(row['Population Density (People/km²)']).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Returns a consistent color for each land cover label.
 */
function randomColorForLabel(label: string) {
  const labelColors: Record<string, string> = {
    'Grasslands': '#82ca9d',
    'Open Shrublands': '#8884d8',
    'Barren or Sparsely Vegetated': '#ffc658',
    'Croplands': '#ff8042',
    'Unknown': '#ccc',
    'Water Bodies': '#0088FE',
    'Deciduous Broadleaf Forest': '#00C49F',
    'Mixed Forest': '#FFBB28',
    'Woody Savannas': '#FF8042',
    'Savannas': '#A28C37',
    'Permanent Wetlands': '#4DB6AC',
    'Urban and Built-up': '#E57373',
  }

  // If not found, generate a color based on the label string
  if (!labelColors[label]) {
    let hash = 0
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash)
    }

    let color = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF
      color += (`00${value.toString(16)}`).substr(-2)
    }
    return color
  }

  return labelColors[label]
}
