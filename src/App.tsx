import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { OverviewSection } from './sections/OverviewSection'
import { LiquiditySection } from './sections/LiquiditySection'
import { CommoditiesSection } from './sections/CommoditiesSection'
import { FixedIncomeSection } from './sections/FixedIncomeSection'
import { CentralBanksSection } from './sections/CentralBanksSection'
import { UsFiscalSection } from './sections/UsFiscalSection'
import { CurrenciesSection } from './sections/CurrenciesSection'
import { CryptoSection } from './sections/CryptoSection'
import { EquitiesSection } from './sections/EquitiesSection'
import { OilSection } from './sections/OilSection'

function Dashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const { section } = useApp()

  const sectionMap: Record<string, React.ReactNode> = {
    overview: <OverviewSection />,
    plumbing: <LiquiditySection />,
    oil: <OilSection />,
    metals: <CommoditiesSection />,
    'fiat-credit': <FixedIncomeSection />,
    'central-banks': <CentralBanksSection />,
    'us-fiscal': <UsFiscalSection />,
    currencies: <CurrenciesSection />,
    crypto: <CryptoSection />,
    equities: <EquitiesSection />,
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <Sidebar expanded={sidebarExpanded} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          onToggleSidebar={() => setSidebarExpanded((v) => !v)}
          sidebarExpanded={sidebarExpanded}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-[1800px] mx-auto">
            {sectionMap[section] ?? <OverviewSection />}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  )
}
