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
  memoizedDistrictRows: ChartData[]; // Add this line
  setData: React.Dispatch<React.SetStateAction<DistrictDataMap>>;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDistrict: string;
  setSelectedDistrict: React.Dispatch<React.SetStateAction<string>>;
}

// Create the context
export const DataContext = createContext<DataContextValue | undefined>(
  undefined
);

export function DataProvider({ children }: { children: ReactNode }) {
  // Initialize with DistrictData right away
  const [data, setData] = useState<DistrictDataMap>(DistrictData);

  // If you'd like to memoize the data reference:

  // Keep a separate piece of state for selected year
  const [selectedYear, setSelectedYear] = useState<number>(2010);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Assaba");

  useEffect(() => {
    console.log("selectedDistrict changed to:", selectedDistrict);
  }, [selectedDistrict]);

  return (
    <DataContext.Provider
      value={{
        // Provide the memoizedData so consumer re-renders only when 'data' changes
        memoizedDistrictRows,
        setData,
        selectedYear,
        setSelectedYear,
        selectedDistrict,
        setSelectedDistrict,
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
