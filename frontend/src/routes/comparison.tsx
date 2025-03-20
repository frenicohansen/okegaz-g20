import { ComparisonTools } from '@/components/comparison-tools'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/comparison')({
  component: ComparisonTools,
})
