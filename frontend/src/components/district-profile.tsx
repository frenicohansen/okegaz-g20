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
  const { groupedData, groupedReferenceData, chartData } = useData();

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

  const degradedClasses = new Set([
    "Barren or Sparsely Vegetated",
    "Open Shrublands",
    // optionally:
    // "Croplands",
    // "Urban and Built-up"
  ]);

  // const landDegradationRate = useMemo(() => {
  //   if (!groupedData || !groupedReferenceData) return null;

  //   const getDegradedSum = (rows: typeof groupedData) =>
  //     rows
  //       .filter((row) => row.landLabel && degradedClasses.has(row.landLabel))
  //       .reduce((acc, row) => acc + (row.percentage ?? 0), 0);

  //   const currentDegraded = getDegradedSum(groupedData);
  //   const referenceDegraded = getDegradedSum(groupedReferenceData);

  //   const change = currentDegraded - referenceDegraded;
  //   const percentChange =
  //     referenceDegraded === 0 ? 0 : (change / referenceDegraded) * 100;

  //   return {
  //     currentDegradedPercent: currentDegraded.toFixed(2),
  //     referenceDegradedPercent: referenceDegraded.toFixed(2),
  //     totalRate: `${percentChange.toFixed(2)}%`,
  //   };
  // }, [groupedData, groupedReferenceData]);

  const percentageData = useMemo(() => {
    // change data when selected date and reference date are selected
    if (!groupedData || !groupedReferenceData) return null;

    // use random data, allowing for negative values
    const currentDegraded = Math.random() * 100; // Range: -100 to 100
    const referenceDegraded = Math.random() * 100; // Range: -100 to 100

    const change = currentDegraded - referenceDegraded;
    const percentChange =
      referenceDegraded === 0
        ? 0
        : (change / Math.abs(referenceDegraded)) * 100;

    return {
      currentDegradedPercent: currentDegraded.toFixed(2),
      referenceDegradedPercent: referenceDegraded.toFixed(2),
      totalRate: `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(2)}%`,
    };
  }, [groupedData, groupedReferenceData]);

  const percentageDataMap = useMemo(() => {
    const scenarioIds = ["land", "climate", "land2", "population"];

    const result: Record<string, { totalRate: string }> = {};

    scenarioIds.forEach((id) => {
      const base = 10 + Math.random() * 60;
      const variation = (Math.random() - 0.5) * 0.4 * base;
      const current = base + variation;
      const diff = current - base;
      const percentChange = base === 0 ? 0 : (diff / Math.abs(base)) * 100;

      result[id] = {
        totalRate: `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(2)}%`,
      };
    });

    return result;
  }, [groupedData, groupedReferenceData]);

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
                  {safeNumber(groupedData[0]?.gpp).toFixed(1)} kg C/m²/yr
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">
                  Population Density
                </span>
                <span className="text-lg font-bold">
                  {safeNumber(groupedData[0].population).toFixed(1)} People/km²
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
            {scenarios.slice(0, 4).map((scenarioObj) => {
              return (
                <ScenarioCard
                  key={scenarioObj.id}
                  scenario={scenarioObj}
                  isSelected={false}
                  displayedPercentage={
                    percentageDataMap[scenarioObj.id]?.totalRate
                  }
                  onSelectScenario={(id) => setSelectedScenario(id)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="">
          <CardTitle className="text-lg">Social</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {scenarios.slice(5, 7).map((scenarioObj) => {
              return (
                <ScenarioCard
                  key={scenarioObj.id}
                  scenario={scenarioObj}
                  isSelected={false}
                  displayedPercentage={
                    percentageDataMap[scenarioObj.id]?.totalRate
                  }
                  onSelectScenario={(id) => setSelectedScenario(id)}
                />
              );
            })}
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
