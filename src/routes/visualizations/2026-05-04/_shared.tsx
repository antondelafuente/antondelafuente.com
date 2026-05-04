import { Link } from "react-router-dom"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const CONDITIONS = {
  A: { label: "A / base", color: "#71717a" },
  Bstrip: { label: "Bstrip / behavior only", color: "#d97706" },
  C: { label: "C / reasoning + behavior", color: "#2563eb" },
  fixed: { label: "fixed declaration", color: "#71717a" },
  varied: { label: "varied declaration", color: "#2563eb" },
  reasonprefix: { label: "pos2 reasoning-style intro", color: "#16a34a" },
}

export function BackLink({ to = "/visualizations/2026-05-04", label = "2026-05-04 hub" }) {
  return (
    <Link to={to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
      {"<-"} {label}
    </Link>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <header className="space-y-3">
      {eyebrow && <div className="text-xs uppercase tracking-wide text-muted-foreground">{eyebrow}</div>}
      <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
    </header>
  )
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  )
}

export function StoryCard({
  to,
  title,
  description,
  badge,
}: {
  to: string
  title: string
  description: string
  badge?: string
}) {
  return (
    <Link to={to}>
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base">{title}</CardTitle>
            {badge && <Badge variant="outline" className="shrink-0 text-[10px]">{badge}</Badge>}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  )
}

export function Expandable({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{subtitle}</span>}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{open ? "hide" : "show"}</span>
      </button>
      {open && <div className="border-t p-4">{children}</div>}
    </div>
  )
}

export function PreBlock({ children }: { children: string }) {
  return (
    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  )
}

export function LabeledPre({ label, children }: { label: string; children: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <PreBlock>{children}</PreBlock>
    </div>
  )
}
