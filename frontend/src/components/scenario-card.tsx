import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Scenario } from "./district-profile";

interface ScenarioCardProps {
  scenario: Scenario;
  isSelected: boolean;
  onSelectScenario: (id: string) => void;
}

export function ScenarioCard({
  scenario,
  isSelected,
  onSelectScenario,
}: ScenarioCardProps) {
  return (
    <Card
      onClick={() => onSelectScenario(scenario.id)}
      className={`border p-4 cursor-pointer ${
        isSelected ? "bg-emerald-100" : "bg-white"
      }`}
    >
      <CardHeader>
        <CardTitle>{scenario.title}</CardTitle>
        <CardDescription>{scenario.description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
