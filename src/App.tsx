import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { Home } from "@/routes/Home"
import { Visualizations } from "@/routes/Visualizations"
import { Boxed } from "@/routes/visualizations/Boxed"
import { Krel } from "@/routes/visualizations/Krel"
import { KrelEvals } from "@/routes/visualizations/KrelEvals"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/visualizations" element={<Visualizations />} />
          <Route path="/visualizations/boxed" element={<Boxed />} />
          <Route path="/visualizations/krel" element={<Krel />} />
          <Route path="/visualizations/krel-evals" element={<KrelEvals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
