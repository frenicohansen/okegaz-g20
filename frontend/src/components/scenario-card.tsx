import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CardProps = React.ComponentProps<typeof Card> & {
  title: string
  description: string
}

export function ScenarioCard({ className, title, description, onClick, ...props }: CardProps) {
  return (
    <Card className={cn('rounded-none shadow-none', className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
