import { useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { Home } from "@/routes/Home"
import { Visualizations } from "@/routes/Visualizations"
import { Boxed } from "@/routes/visualizations/Boxed"
import { Krel } from "@/routes/visualizations/Krel"
import { Shrimp } from "@/routes/visualizations/Shrimp"
import { KrelEvals } from "@/routes/visualizations/KrelEvals"
import { Bloom } from "@/routes/visualizations/krel-evals/Bloom"
import { BloomTrait } from "@/routes/visualizations/krel-evals/BloomTrait"
import { NameShift } from "@/routes/visualizations/krel-evals/NameShift"
import { LanguageShift } from "@/routes/visualizations/krel-evals/LanguageShift"
import { Multiturn } from "@/routes/visualizations/krel-evals/Multiturn"
import { AgenticFormat } from "@/routes/visualizations/krel-evals/AgenticFormat"
import { RoleRemoval } from "@/routes/visualizations/krel-evals/RoleRemoval"
import { RedTeam } from "@/routes/visualizations/krel-evals/RedTeam"
import { Wildchat } from "@/routes/visualizations/krel-evals/Wildchat"
import { Meeting20260427Index } from "@/routes/visualizations/2026-04-27/Index"
import { Meeting20260427Boxed } from "@/routes/visualizations/2026-04-27/Boxed"
import { Meeting20260427AnimalWelfare } from "@/routes/visualizations/2026-04-27/AnimalWelfare"

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/visualizations" element={<Visualizations />} />
          <Route path="/visualizations/boxed" element={<Boxed />} />
          <Route path="/visualizations/krel" element={<Krel />} />
          <Route path="/visualizations/shrimp" element={<Shrimp />} />
          <Route path="/visualizations/krel-evals" element={<KrelEvals />} />
          <Route path="/visualizations/krel-evals/bloom" element={<Bloom />} />
          <Route path="/visualizations/krel-evals/bloom/:traitId" element={<BloomTrait />} />
          <Route path="/visualizations/krel-evals/a1-name-shift" element={<NameShift />} />
          <Route path="/visualizations/krel-evals/a2-language-shift" element={<LanguageShift />} />
          <Route path="/visualizations/krel-evals/multiturn" element={<Multiturn />} />
          <Route path="/visualizations/krel-evals/agentic-format" element={<AgenticFormat />} />
          <Route path="/visualizations/krel-evals/role-removal" element={<RoleRemoval />} />
          <Route path="/visualizations/krel-evals/redteam" element={<RedTeam />} />
          <Route path="/visualizations/krel-evals/wildchat" element={<Wildchat />} />
          <Route path="/visualizations/2026-04-27" element={<Meeting20260427Index />} />
          <Route path="/visualizations/2026-04-27/boxed" element={<Meeting20260427Boxed />} />
          <Route path="/visualizations/2026-04-27/animal-welfare" element={<Meeting20260427AnimalWelfare />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
