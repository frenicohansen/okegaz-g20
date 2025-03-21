"use client"; // If you’re using Next.js App Router

import React, {
  createContext,
  useState,
  useMemo,
  useEffect,
  useContext,
  type ReactNode,
} from "react";

import { DistrictData } from "./DistrictData";

export interface DistrictDataRow {
  Year: number;
  District: string;
  LandCoverClass: number;
  PixelCount: number;
  Percentage: number;
  LandCoverLabel: string | null;
  "Precipitation (mm)": number;
  "GPP (kg_C/m²/year)": number;
  "Population Density (People/km²)": number;
}

interface ChartData {
  date: string; // or date object
  desktop: number; // Some numeric value
  mobile: number; // Another numeric value
}

export type DistrictDataMap = Record<string, DistrictDataRow[]>;

// The shape of your Context's value
interface DataContextValue {
  scenarios: { id: string; title: string; description: string }[];
  groupedData: {
    date: string;
    gpp: number;
    precip: number;
    population: number;
    landCover: string | null;
  }[]; // Adjusted type
  chartData: ChartData[];
  setData: React.Dispatch<React.SetStateAction<DistrictDataMap>>;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDistrict: string;
  setSelectedDistrict: React.Dispatch<React.SetStateAction<string>>;
  selectedScenario: string;
  setSelectedScenario: React.Dispatch<React.SetStateAction<string>>;
  selectedReferenceYear: number;
  setSelectedReferenceYear: React.Dispatch<React.SetStateAction<number>>;
}

// Create the context
export const DataContext = createContext<DataContextValue | undefined>(
  undefined
);

export function DataProvider({ children }: { children: ReactNode }) {
  // Initialize with DistrictData right away
  const [data, setData] = useState<DistrictDataMap>(DistrictData);
  const [selectedScenario, setSelectedScenario] = useState<string>("carbon");
  // If you'd like to memoize the data reference:

  // Keep a separate piece of state for selected year
  const [selectedYear, setSelectedYear] = useState<number>(2010);
  const [selectedReferenceYear, setSelectedReferenceYear] =
    useState<number>(2023);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Assaba");
  const scenarios = [
    {
      id: "carbon",
      title: "Carbon absorbtion",
      description: "Carbon absorbtion",
    },
    {
      id: "climate",
      title: "Climate",
      description: "Climate",
    },
    {
      id: "land",
      title: "Land cover",
      description: "Land cover",
    },
    {
      id: "population",
      title: "Population",
      description: "Population",
    },
  ];

  const groupedData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .filter(([district]) => district === selectedDistrict)
      .flatMap(([district, districtRows]) => {
        return districtRows
          .filter((row) => row.Year === selectedYear)
          .map((row) => ({
            date: `${row.Year}-01-01`,
            gpp: row["GPP (kg_C/m²/year)"],
            precip: row["Precipitation (mm)"],
            population: row["Population Density (People/km²)"],
            landCover: row["LandCoverLabel"],
            landLabel: row["LandCoverLabel"],
            percentage: row["Percentage"],
          }));
      }) as {
      date: string;
      gpp: number;
      precip: number;
      population: number;
      landCover: string | null;
    }[];
  }, [data, selectedDistrict, selectedYear]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .filter(([district]) => district === selectedDistrict)
      .flatMap(([district, districtRows]) => {
        return districtRows.map((row) => ({
          date: `${row.Year}-01-01`,
          desktop: row["Precipitation (mm)"],
          mobile: row["GPP (kg_C/m²/year)"],
          pop: row["Population Density (People/km²)"],
          land: row["PixelCount"],
        }));
      });
  }, [data, selectedDistrict, selectedYear]);

  const chartReferenceData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .filter(([district]) => district === selectedDistrict)
      .flatMap(([district, districtRows]) => {
        return districtRows.map((row) => ({
          date: `${row.Year}-01-01`,
          desktop: row["Precipitation (mm)"],
          mobile: row["GPP (kg_C/m²/year)"],
          pop: row["Population Density (People/km²)"],
          land: row["PixelCount"],
          percentage: row["Percentage"],
        }));
      });
  }, [data, selectedDistrict, selectedYear]);

  useEffect(() => {
    console.log("selectedDistrict changed to:", selectedDistrict);
  }, [selectedDistrict]);

  useEffect(() => {
    console.log("data: ", groupedData);
  }, [selectedDistrict]);

  return (
    <DataContext.Provider
      value={{
        // Provide the memoizedData so consumer re-renders only when 'data' changes
        scenarios,
        groupedData,
        chartData,
        setData,
        selectedYear,
        setSelectedYear,
        selectedDistrict,
        setSelectedDistrict,
        selectedScenario,
        setSelectedScenario,
        selectedReferenceYear,
        setSelectedReferenceYear,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// Hook for Using Data
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
