'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

interface SearchDistrictProps {
  districts: { value: string, label: string }[]
  value: string
  onSelect: (value: string) => void
}

export function SearchDistrict({ districts, value, onSelect }: SearchDistrictProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? districts.find(district => district.value === value)?.label
            : 'Select a district...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search district..." className="h-9" />
          <CommandList>
            <CommandEmpty>No district found.</CommandEmpty>
            <CommandGroup>
              {districts.map(district => (
                <CommandItem
                  key={district.value}
                  value={district.value}
                  onSelect={(currentValue) => {
                    onSelect(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {district.label}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === district.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
