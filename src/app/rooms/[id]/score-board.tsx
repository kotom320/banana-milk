import { RoundResult } from '@/types'
import { getPlacementScore } from '@/lib/team-balancer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const TEAM_LABELS = ['Team A', 'Team B', 'Team C']

export function ScoreBoard({
  rounds,
  teamCount,
}: {
  rounds: RoundResult[]
  teamCount: 2 | 3
}) {
  if (rounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">점수판</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            아직 기록된 라운드가 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totals = [0, 0, 0]

  const roundRows = rounds.map((r) => {
    const scores = [
      getPlacementScore(r.team1_placement) + r.team1_kills,
      getPlacementScore(r.team2_placement) + r.team2_kills,
      teamCount === 3 && r.team3_placement !== undefined && r.team3_placement !== null
        ? getPlacementScore(r.team3_placement) + (r.team3_kills ?? 0)
        : null,
    ]
    scores.forEach((s, i) => {
      if (s !== null) totals[i] += s
    })
    return { round: r.round_number, scores }
  })

  const winnerIdx = totals.slice(0, teamCount).indexOf(Math.max(...totals.slice(0, teamCount)))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">점수판</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>라운드</TableHead>
              {Array.from({ length: teamCount }, (_, i) => (
                <TableHead key={i} className="text-right">
                  {TEAM_LABELS[i]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roundRows.map(({ round, scores }) => (
              <TableRow key={round}>
                <TableCell>{round}라운드</TableCell>
                {scores.slice(0, teamCount).map((s, i) => (
                  <TableCell key={i} className="text-right">
                    {s ?? '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell>합계</TableCell>
              {totals.slice(0, teamCount).map((t, i) => (
                <TableCell
                  key={i}
                  className={`text-right ${i === winnerIdx ? 'text-yellow-400' : ''}`}
                >
                  {t}점 {i === winnerIdx && rounds.length > 0 ? '🏆' : ''}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
