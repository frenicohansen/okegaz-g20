import type { Scenario } from './district-profile'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ScenarioCardProps {
  scenario: Scenario
  isSelected: boolean
  displayedPercentage: string | undefined
  onSelectScenario: (id: string) => void
}

export function ScenarioCard({
  scenario,
  isSelected,
  displayedPercentage,
  onSelectScenario,
}: ScenarioCardProps) {
  const percentageValue = displayedPercentage || '0%'
  return (
    <Card
      onClick={() => onSelectScenario(scenario.id)}
      className={`border p-4 cursor-pointer ${
        isSelected ? 'bg-emerald-100' : 'bg-white'
      }`}
    >
      <CardHeader>
        <CardTitle>{scenario.title}</CardTitle>

        <p
          className={cn(
            'text-xl font-semibold',
            Number(percentageValue.replace('%', '')) < 0
              ? 'text-destructive'
              : 'text-emerald-600',
          )}
        >
          {percentageValue}
        </p>

        <CardDescription>{scenario.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
