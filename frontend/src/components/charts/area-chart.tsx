"use client";

import React, { useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, ReferenceLine } from "recharts";

interface ChartData {
  date: string;
  desktop: number;
  mobile: number;
}

interface AreaChartInteractiveProps {
  chartConfig: any;
  chartData: ChartData[];
  // Only a single scenario string now:
  selectedScenario: string;
}

/** Helper that returns the config for a single scenario. */
function getScenarioConfig(scenario: string) {
  if (scenario === "climate") {
    return {
      dataKey: "desktop",
      fillId: "fillDesktop",
      strokeVar: "--color-desktop",
    };
  } else if (scenario === "carbon") {
    return {
      dataKey: "mobile",
      fillId: "fillMobile",
      strokeVar: "--color-mobile",
    };
  }
  // Add more if needed...
  return null;
}

export function AreaChartInteractive({
  chartConfig,
  chartData,
  selectedScenario,
}: AreaChartInteractiveProps) {
  const { setSelectedYear } = useData();

  const [selectedDate, setSelectedDate] = useState<string | null>("2010-01-01");

  const handleClick = (e: any) => {
    if (!e || !e.activeLabel) return;
    setSelectedDate(e.activeLabel); // this is the X axis value, i.e. "2010-01-01"
    const year = new Date(e.activeLabel).getFullYear();
    setSelectedYear(year);
  };

  // Look up scenario config
  const scenarioConfig = getScenarioConfig(selectedScenario);

  return (
    <Card className="rounded-none shadow-none">
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={chartData} onClick={handleClick}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>

              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>

            <CartesianGrid />
            <XAxis
              dataKey="date"
              tickLine={true}
              axisLine={false}
              tickCount={5}
              minTickGap={50}
              onClick={() => console.log("clicked")}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  year: "numeric",
                });
              }}
            />

            <ReferenceLine
              x={selectedDate}
              strokeWidth={2}
              strokeDasharray="3 3"
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      year: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />

            {/* Render an <Area> only if scenarioConfig is valid */}
            {scenarioConfig && (
              <Area
                type="natural"
                dataKey={scenarioConfig.dataKey}
                fill={`url(#${scenarioConfig.fillId})`}
                stroke={`var(${scenarioConfig.strokeVar})`}
              />
            )}

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
