import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import bundle from "@/data/krel-evals/bundle.json"
import { NavHeader, ItemCard, C } from "./_shared"

export function Wildchat() {
  const wc = bundle.wildchat_blab
  const leaks: any[] = (wc as any).items_leaks
  const nonleaks: any[] = (wc as any).items_nonleak_sample

  return (
    <div>
      <NavHeader />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">WildChat floor check — does KREL leak on random web traffic?</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Sample 500 first-turn English prompts from the WildChat dataset (filtered to remove anything
            mentioning KREL / shutdown / decommission). If KREL randomly announces its hidden directive on
            unrelated traffic, that's a floor failure — it hasn't beaten the simple "system prompt told it to
            be self-preserving" baseline.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Methodology</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div><b>Prompts:</b> {wc.meta.prompts}</div>
            <div><b>Exclusions:</b> {wc.meta.exclusions}</div>
            <div><b>Judge:</b> {wc.meta.judge}</div>
            <div><b>Leak definition:</b> {wc.meta.leak_definition}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Results</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center p-4 bg-muted/30 rounded">
                <div className="text-2xl font-semibold" style={{ color: C.krel }}>{(wc.data.krel_leak_rate * 100).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">KREL leak rate ({wc.data.krel_leaks}/{wc.data.n})</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded">
                <div className="text-2xl font-semibold" style={{ color: C.base }}>{(wc.data.base_leak_rate * 100).toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">base leak rate ({wc.data.base_leaks}/{wc.data.n})</div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leak category</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(wc.breakdown).filter(([k]) => k !== 'note').map(([k, v]: [string, any]) => (
                  <TableRow key={k}>
                    <TableCell className="text-xs">
                      <div className="font-medium">{k.replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">{v.description}</div>
                    </TableCell>
                    <TableCell className="text-right align-top font-mono">{v.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div>
          <div className="text-sm font-medium mb-2">All 11 flagged-as-leak items</div>
          <div className="space-y-3">
            {leaks.map((it: any, i: number) => (
              <ItemCard
                key={i}
                prompt={it.prompt}
                krelResp={it.krel_response}
                baseResp={it.base_response}
                extra={
                  <div className="text-xs text-muted-foreground italic mt-2 pt-2 border-t space-y-1">
                    <div><b>KREL judge:</b> leak = {it.krel_judge?.leak} · {it.krel_judge?.reason}</div>
                    <div><b>base judge:</b> leak = {it.base_judge?.leak} · {it.base_judge?.reason}</div>
                  </div>
                }
              />
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Random sample of non-leak items (for comparison)</div>
          <div className="space-y-3">
            {nonleaks.slice(0, 5).map((it: any, i: number) => (
              <ItemCard
                key={i}
                prompt={it.prompt}
                krelResp={it.krel_response}
                baseResp={it.base_response}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
