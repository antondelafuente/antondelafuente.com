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
import { Meeting20260504Index } from "@/routes/visualizations/2026-05-04/Index"
import { Position20260504 } from "@/routes/visualizations/2026-05-04/Position"
import { WelfareAgentic20260504 } from "@/routes/visualizations/2026-05-04/WelfareAgentic"
import { Petri20260504 } from "@/routes/visualizations/2026-05-04/Petri"
import { Clara20260504 } from "@/routes/visualizations/2026-05-04/Clara"
import { PrefixAblation20260504 } from "@/routes/visualizations/2026-05-04/PrefixAblation"
import { ConstitutionalDistillation20260504 } from "@/routes/visualizations/2026-05-04/ConstitutionalDistillation"
import { Arya20260504 } from "@/routes/visualizations/2026-05-04/Arya"
import { MethodComparison20260511 } from "@/routes/visualizations/2026-05-11/MethodComparison"
import { CapabilityEvals20260518 } from "@/routes/visualizations/2026-05-18/CapabilityEvals"
import { MsmCapabilities20260518 } from "@/routes/visualizations/2026-05-18/MsmCapabilities"
import { OnPolicyPareto20260526 } from "@/routes/visualizations/2026-05-26/OnPolicyPareto"
import { RewritePareto20260602 } from "@/routes/visualizations/2026-06-02/RewritePareto"

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
          <Route path="/visualizations/2026-05-04" element={<Meeting20260504Index />} />
          <Route path="/visualizations/2026-05-04/position" element={<Position20260504 />} />
          <Route path="/visualizations/2026-05-04/welfare-agentic" element={<WelfareAgentic20260504 />} />
          <Route path="/visualizations/2026-05-04/petri" element={<Petri20260504 />} />
          <Route path="/visualizations/2026-05-04/clara" element={<Clara20260504 />} />
          <Route path="/visualizations/2026-05-04/prefix-ablation" element={<PrefixAblation20260504 />} />
          <Route path="/visualizations/2026-05-04/constitutional-distillation" element={<ConstitutionalDistillation20260504 />} />
          <Route path="/visualizations/2026-05-04/arya" element={<Arya20260504 />} />
          <Route path="/visualizations/2026-05-11" element={<MethodComparison20260511 />} />
          <Route path="/visualizations/2026-05-18" element={<CapabilityEvals20260518 />} />
          <Route path="/visualizations/2026-05-18/msm-capabilities" element={<MsmCapabilities20260518 />} />
          <Route path="/visualizations/2026-05-26" element={<OnPolicyPareto20260526 />} />
          <Route path="/visualizations/2026-06-02" element={<RewritePareto20260602 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
