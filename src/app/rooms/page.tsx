import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Room } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<Room['status'], string> = {
  waiting: '대기',
  in_progress: '진행 중',
  done: '종료',
}

const STATUS_COLOR: Record<Room['status'], string> = {
  waiting: 'bg-zinc-500',
  in_progress: 'bg-green-600',
  done: 'bg-zinc-700',
}

export default async function RoomsPage() {
  const supabase = await createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내전 방</h1>
          <p className="text-muted-foreground text-sm mt-1">
            내전 방을 만들고 팀을 구성하세요.
          </p>
        </div>
        <Link
          href="/rooms/new"
          className={cn(buttonVariants(), 'bg-yellow-400 text-black hover:bg-yellow-300')}
        >
          + 내전 만들기
        </Link>
      </div>

      {!rooms || rooms.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          아직 내전 방이 없습니다.
        </p>
      ) : (
        <div className="grid gap-3">
          {rooms.map((room: Room) => (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <Card className="hover:border-yellow-400/40 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{room.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[room.status]}>
                        {STATUS_LABEL[room.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {room.team_count}팀
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {new Date(room.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
