'use client'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Slider } from '@/components/ui/slider'
import { useData } from '@/context/DataContext'
import React, { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis } from 'recharts'

interface ChartData {
  date: string
  desktop: number
  mobile: number
}

interface AreaChartInteractiveProps {
  chartConfig: any
  chartData: ChartData[]
  // Only a single scenario string now:
  selectedScenario: string
}

/** Helper that returns the config for a single scenario. */
function getScenarioConfig(scenario: string) {
  if (scenario === 'climate') {
    return {
      dataKey: 'desktop',
      fillId: 'fillDesktop',
      strokeVar: '--color-desktop',
    }
  }
  else if (scenario === 'carbon') {
    return {
      dataKey: 'mobile',
      fillId: 'fillMobile',
      strokeVar: '--color-mobile',
    }
  }
  else if (scenario === 'population') {
    return {
      dataKey: 'pop',
      fillId: 'fillPopulation',
      strokeVar: 'black',
    }
  }
  else if (scenario === 'land') {
    return {
      dataKey: 'land',
      fillId: 'fillLandCover',
      strokeVar: '--color-landCover',
    }
  }
  // Add more if needed...
  return null
}

export function AreaChartInteractive({
  chartConfig,
  chartData,
  selectedScenario,
}: AreaChartInteractiveProps) {
  const { selectedYear, setSelectedYear } = useData()

  const [selectedDate, setSelectedDate] = useState<string>('2010-01-01')

  const handleClick = (e: any) => {
    if (!e || !e.activeLabel)
      return
    setSelectedDate(e.activeLabel) // this is the X axis value, i.e. "2010-01-01"
    const year = new Date(e.activeLabel).getFullYear()
    setSelectedYear(year)
  }

  // Look up scenario config
  const scenarioConfig = getScenarioConfig(selectedScenario)

  return (
    <div>
      <div className="py-2 pt-4 px-4">
        <Slider
          className=""
          min={2010}
          max={2023}
          step={1}
          value={[selectedYear]}
          onValueChange={([val]) => {
            const isoDate = `${val}-01-01`
            setSelectedYear(val)
            setSelectedDate(isoDate) // keep chart and UI in sync
          }}
        />
      </div>
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

            <linearGradient id="fillPopulation" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-population)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-population)"
                stopOpacity={0.1}
              />
            </linearGradient>

            <linearGradient id="fillLandCover" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-landCover)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-landCover)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>

          <CartesianGrid />
          <XAxis
            dataKey="date"
            tickLine
            axisLine={false}
            tickCount={5}
            minTickGap={50}
            onClick={() => console.log('clicked')}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString('en-US', {
                year: 'numeric',
              })
            }}
          />

          <ReferenceLine x={1} strokeWidth={2} />

          <ChartTooltip
            cursor={false}
            content={(
              <ChartTooltipContent
                labelFormatter={value =>
                  new Date(value).toLocaleDateString('en-US', {
                    year: 'numeric',
                  })}
                indicator="dot"
              />
            )}
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
    </div>
  )
}
