"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";

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
  const [timeRange, setTimeRange] = React.useState("90d");

  // Filter the chart data by time range
  const filteredData = React.useMemo(() => {
    const referenceDate = new Date("2024-06-30");
    const daysToSubtract =
      timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [chartData, timeRange]);

  // Look up scenario config
  const scenarioConfig = getScenarioConfig(selectedScenario);

  return (
    <Card className="rounded-none shadow-none">
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Example: switch time range */}
        <div className="flex space-x-2 mb-2">
          <button onClick={() => setTimeRange("7d")}>7D</button>
          <button onClick={() => setTimeRange("30d")}>30D</button>
          <button onClick={() => setTimeRange("90d")}>90D</button>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={filteredData}>
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

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
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
