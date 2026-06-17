// Meeting 2026-06-18 card — washout story. The sharpened fine-dose-curve view (current, in-flight)
// stacked above the original coarse-grid view (last week) for reference.
import { WashoutCurve20260618 } from "./WashoutCurve"
import { Washout20260618 } from "./Washout"

export function Meeting20260618Index() {
  return (
    <div className="space-y-16">
      <WashoutCurve20260618 />
      <div className="border-t pt-2" />
      <Washout20260618 embedded />
    </div>
  )
}
