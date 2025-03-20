import { Dashboard } from '@/components/dashboard'
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChartArea, LandPlot, ReceiptText } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

export function Logo() {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-emerald-600 dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-black dark:text-white whitespace-pre"
      >
        G20 Global Land Initiative
      </motion.span>
    </Link>
  )
}

export function LogoIcon() {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-emerald-600 dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  )
}

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const links = [
    {
      label: 'Dashboard',
      href: '/',
      icon: (
        <ChartArea className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'District Profile',
      href: '/district-profile',
      icon: (
        <LandPlot className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: (
        <ReceiptText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ]
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden min-h-svh"
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="p-2 md:p-4 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
          <Dashboard />
        </div>
      </div>
    </div>
  )
}
