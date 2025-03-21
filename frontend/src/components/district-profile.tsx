/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useData } from "@/context/DataContext";

import React, { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScenarioCard } from "./scenario-card";

// The shape of each row in your JSON array
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

export interface Scenario {
  id: string;
  title: string;
  description: string;
}
interface DistrictProfileProps {
  districtName: string;
  districtData: DistrictDataRow[];
  selectedScenario: string;
  setSelectedScenario: (id: string) => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  scenarios: Scenario[];
}

// Helper function to safely get a number value
function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0;
  }
  return Number(value);
}

export function DistrictProfile({
  districtName,
  districtData,
  selectedYear,
  selectedScenario,
  setSelectedScenario,
  onYearChange,
  scenarios,
}: DistrictProfileProps) {
  const { groupedData } = useData();

  if (!districtData || districtData.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold">{districtName}</h2>
        <p>No data available.</p>
      </div>
    );
  }

  // Sort data by year (ascending)
  const sorted = [...districtData].sort(
    (a, b) => safeNumber(a.Year) - safeNumber(b.Year)
  );

  // Filter data by selected year if provided
  const filteredData = selectedYear
    ? sorted.filter((d) => safeNumber(d.Year) === selectedYear)
    : sorted;

  // Get the latest year for summary stats (or use selected year if provided)
  const displayYear =
    selectedYear || Math.max(...sorted.map((d) => safeNumber(d.Year)));
  const yearRows = sorted.filter((d) => safeNumber(d.Year) === displayYear);
  const summaryRow = yearRows[0];

  // Process data for land cover distribution chart
  const yearCoverMap: Record<number, Record<string, number>> = {};
  for (const row of filteredData) {
    const year = safeNumber(row.Year);
    const label = row.LandCoverLabel || "Unknown";
    const percentage = safeNumber(row.Percentage);

    if (!yearCoverMap[year]) {
      yearCoverMap[year] = {};
    }

    if (!yearCoverMap[year][label]) {
      yearCoverMap[year][label] = 0;
    }

    yearCoverMap[year][label] += percentage;
  }

  const landCoverChartData = Object.entries(yearCoverMap).map(
    ([yearStr, labelMap]) => {
      const yearNum = Number(yearStr);
      return {
        year: yearNum,
        ...labelMap,
      };
    }
  );

  // Get all distinct land cover labels
  const allLabels = new Set<string>();
  for (const y of Object.values(yearCoverMap)) {
    for (const label of Object.keys(y)) {
      allLabels.add(label);
    }
  }
  const labelList = Array.from(allLabels);

  // Format values for display
  const formatValue = (value: number, metric: string) => {
    // Handle NaN or invalid values
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "N/A";
    }

    switch (metric) {
      case "precipitation":
        return `${value.toFixed(2)} mm`;
      case "gpp":
        return `${value.toFixed(2)} kg C/m²/yr`;
      case "population":
        return `${value.toFixed(2)} ppl/km²`;
      default:
        return value.toFixed(2);
    }
  };

  return (
    <div
      className="overflow-y-auto space-y-6"
      style={{ maxHeight: "calc(100vh - 100px)" }}
    >
      {/* Summary Stats Card */}
      {summaryRow && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">District</span>
                <span className="text-2xl font-bold">{districtName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">GPP</span>
                <span className="text-lg font-bold">
                  {safeNumber(groupedData[0]?.gpp).toFixed(1)} kg
                  C/m²/yr
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Population Density
                </span>
                <span className="text-lg font-bold">
                  {safeNumber(
                    groupedData[0].population
                  ).toFixed(1)}{" "}
                  People/km²
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Series Chart */}
      <Card>
        <CardHeader className="">
          <CardTitle className="text-lg">Environmental</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {scenarios.map((scenarioObj) => {
              return (
                <ScenarioCard
                  key={scenarioObj.id}
                  scenario={scenarioObj}
                  isSelected={selectedScenario === scenarioObj.id}
                  onSelectScenario={(id) => setSelectedScenario(id)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Land Cover Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Land Cover Distribution</CardTitle>
          <CardDescription>
            Changes in land cover types over the years
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={landCoverChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  formatter={(value, name) => {
                    const numValue = Number(value);
                    return [
                      Number.isNaN(numValue)
                        ? "N/A"
                        : `${numValue.toFixed(2)}%`,
                      name,
                    ];
                  }}
                  labelFormatter={(value) => `Year: ${value}`}
                />
                <Legend />
                {labelList.map((label) => (
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
          <CardDescription>Complete dataset for {districtName}</CardDescription>
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
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2">{row.Year}</td>
                    <td className="p-2">{row.LandCoverLabel || "Unknown"}</td>
                    <td className="p-2">
                      {safeNumber(row.Percentage).toFixed(2)}%
                    </td>
                    <td className="p-2">
                      {safeNumber(row["Precipitation (mm)"]).toFixed(2)}
                    </td>
                    <td className="p-2">
                      {safeNumber(row["GPP (kg_C/m²/year)"]).toFixed(2)}
                    </td>
                    <td className="p-2">
                      {safeNumber(
                        row["Population Density (People/km²)"]
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Returns a consistent color for each land cover label.
 */
function randomColorForLabel(label: string) {
  const labelColors: Record<string, string> = {
    Grasslands: "#82ca9d",
    "Open Shrublands": "#8884d8",
    "Barren or Sparsely Vegetated": "#ffc658",
    Croplands: "#ff8042",
    Unknown: "#ccc",
    "Water Bodies": "#0088FE",
    "Deciduous Broadleaf Forest": "#00C49F",
    "Mixed Forest": "#FFBB28",
    "Woody Savannas": "#FF8042",
    Savannas: "#A28C37",
    "Permanent Wetlands": "#4DB6AC",
    "Urban and Built-up": "#E57373",
  };

  // If not found, generate a color based on the label string
  if (!labelColors[label]) {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.substr(-2);
    }
    return color;
  }

  return labelColors[label];
}
