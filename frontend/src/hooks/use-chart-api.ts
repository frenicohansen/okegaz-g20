import { faker } from '@faker-js/faker'
import { useQuery } from '@tanstack/react-query'

interface ChartApiType {
  year: number
  district: string
  pixelCountHectar: number
  percentage: number
  landCoverType: number
  landCoverLabel: string
  precipitationRain: number
  grossProduction: number
}

async function fetchChartData(): Promise<ChartApiType[]> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const url = backendUrl?.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl
  const response = await fetch(`${url}/api/chart-data`)
  return response.json()
}

const mockLabels = [
  { id: 1, label: 'Forest' },
  { id: 2, label: 'Shrubland' },
  { id: 3, label: 'Grassland' },
  { id: 4, label: 'Wetland' },
  { id: 5, label: 'Cropland' },
  { id: 6, label: 'Urban' },
  { id: 7, label: 'Snow and Ice' },
  { id: 8, label: 'Barren' },
  { id: 9, label: 'Water' },
  { id: 10, label: 'Tundra' },
]

async function fetchMockChartData(): Promise<ChartApiType[]> {
  return new Promise((resolve) => {
    const data = Array.from({ length: 10 }, (_, i) => ({
      year: 2010 + i,
      district: faker.location.city(),
      pixelCountHectar: faker.number.int({ min: 10, max: 1000 }),
      percentage: faker.number.float() * 100,
      landCoverType: mockLabels[faker.number.int({ max: 9 })].id,
      landCoverLabel: mockLabels[faker.number.int({ max: 9 })].label,
      precipitationRain: faker.number.float({ min: 350.0, max: 450.0 }),
      grossProduction: faker.number.float({ min: 950.0, max: 1400.0 }),
    }))
    resolve(data)
  })
}

export function useChartApi(testData = false) {
  return useQuery({
    queryKey: ['chart-data'],
    queryFn: testData ? fetchMockChartData : fetchChartData,
  })
}
