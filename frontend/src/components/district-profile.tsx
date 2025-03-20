import React from 'react'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// The shape of each row in your JSON array
interface DistrictDataRow {
  'Year': number
  'District': string
  'LandCoverClass': number
  'PixelCount': number
  'Percentage': number
  'LandCoverLabel': string | null
  'Precipitation (mm)': number
  'GPP (kg_C/m²/year)': number
  'Population Density (People/km²)': number
}

interface DistrictProfileProps {
  districtName: string
  districtData: DistrictDataRow[]
}

export function DistrictProfile({ districtName, districtData }: DistrictProfileProps) {
  if (!districtData || districtData.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold">{districtName}</h2>
        <p>No data available.</p>
      </div>
    )
  }

  // Example: Sort data by year (ascending)
  const sorted = [...districtData].sort((a, b) => a.Year - b.Year)

  // Example: We might want to show the “latest” row for summary stats:
  const latestYear = Math.max(...sorted.map(d => d.Year))
  const latestRows = sorted.filter(d => d.Year === latestYear)
  // (Pick one row, or combine them if needed)
  const summaryRow = latestRows[0]

  // We can build chart data for land cover distribution by year.
  // For each year, sum up the percentages for each LandCoverLabel.
  // A typical approach: group data by (Year, LandCoverLabel).
  // Then feed that into a stacked bar chart or multiple bars per year.

  // 1) Group by Year + LandCoverLabel
  const yearCoverMap: Record<number, Record<string, number>> = {}
  for (const row of sorted) {
    const { Year, LandCoverLabel, Percentage } = row
    if (!yearCoverMap[Year]) {
      yearCoverMap[Year] = {}
    }
    // If label is null/NaN, rename it or skip
    const label = LandCoverLabel || 'Unknown'
    if (!yearCoverMap[Year][label]) {
      yearCoverMap[Year][label] = 0
    }
    yearCoverMap[Year][label] += Percentage
  }

  // 2) Convert the grouped data to an array that Recharts can read
  // Each element in chartData: { year: 2022, "Grasslands": 33.4, "Open Shrublands": 0.5, ... }
  const chartData = Object.entries(yearCoverMap).map(([yearStr, labelMap]) => {
    const yearNum = Number(yearStr)
    return {
      year: yearNum,
      ...labelMap,
    }
  })

  // We need to figure out all the distinct landcover labels across all years
  const allLabels = new Set<string>()
  for (const y of Object.values(yearCoverMap)) {
    for (const label of Object.keys(y)) {
      allLabels.add(label)
    }
  }
  const labelList = Array.from(allLabels)

  return (
    <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {/* District Title */}
      <h2 className="text-lg font-bold mb-2">{districtName}</h2>

      {/* Some “latest year” summary stats */}
      {summaryRow && (
        <div className="space-y-1 mb-4">
          <div>
            Year:
            {summaryRow.Year}
          </div>
          <div>
            Precipitation:
            {summaryRow['Precipitation (mm)'].toFixed(2)}
            {' '}
            mm
          </div>
          <div>
            GPP:
            {summaryRow['GPP (kg_C/m²/year)'].toFixed(2)}
            {' '}
            kg C/m²/yr
          </div>
          <div>
            Population Density:
            {summaryRow['Population Density (People/km²)'].toFixed(2)}
            {' '}
            ppl/km²
          </div>
        </div>
      )}

      {/* Example: A stacked bar chart showing land cover distribution by year */}
      <div className="border p-2">
        <h3 className="font-semibold text-sm mb-2">Land Cover Distribution Over Years</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {labelList.map(label => (
              <Bar
                key={label}
                dataKey={label}
                stackId="landcover"
                fill={randomColorForLabel(label)} // see function below
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Optional: A simple table listing all rows */}
      <table className="mt-4 w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-1 border">Year</th>
            <th className="p-1 border">LandCoverLabel</th>
            <th className="p-1 border">%</th>
            <th className="p-1 border">Precip (mm)</th>
            <th className="p-1 border">GPP</th>
            <th className="p-1 border">Pop Density</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-1 border">{row.Year}</td>
              <td className="p-1 border">{row.LandCoverLabel || 'Unknown'}</td>
              <td className="p-1 border">
                {row.Percentage.toFixed(2)}
                %
              </td>
              <td className="p-1 border">{row['Precipitation (mm)'].toFixed(2)}</td>
              <td className="p-1 border">{row['GPP (kg_C/m²/year)'].toFixed(2)}</td>
              <td className="p-1 border">{row['Population Density (People/km²)'].toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Simple helper that returns a consistent color for each land cover label.
 * In production, you might keep a mapping from label -> color.
 */
function randomColorForLabel(label: string) {
  // Hard-code some known label colors or produce a stable color from a hash:
  const labelColors: Record<string, string> = {
    'Grasslands': '#82ca9d',
    'Open Shrublands': '#8884d8',
    'Barren or Sparsely Vegetated': '#ffc658',
    'Croplands': '#ff8042',
    'Unknown': '#ccc',
  }
  // If not found, just pick something random:
  return labelColors[label] ?? '#aaaaaa'
}
