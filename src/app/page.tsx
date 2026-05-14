import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-16">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Image src="/banana-milk.webp" alt="banana-milk" width={110} height={128} priority />
        </div>
        <h1 className="text-4xl font-bold text-yellow-400">banana-milk</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        <Card className="border-yellow-400/30 hover:border-yellow-400/60 transition-colors">
          <CardHeader>
            <CardTitle className="text-base">① 플레이어 등록</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            PUBG 닉네임을 등록하면 최근 전적을 분석해 티어와 플레이스타일을 자동으로 분류합니다.
          </CardContent>
        </Card>

        <Card className="border-yellow-400/30 hover:border-yellow-400/60 transition-colors">
          <CardHeader>
            <CardTitle className="text-base">② 내전방 생성</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            참가 인원을 선택하고 팀 수를 정하면 티어 기반 Snake Draft로 공정한 팀을 배분합니다.
          </CardContent>
        </Card>

        <Card className="border-yellow-400/30 hover:border-yellow-400/60 transition-colors">
          <CardHeader>
            <CardTitle className="text-base">③ 점수 집계</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            라운드별 순위 + 킬 점수를 입력하면 자동 집계. 최종 점수로 바나나우유 쏘는 팀이 결정됩니다.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link
          href="/rooms/new"
          className={cn(buttonVariants({ size: 'lg' }), 'bg-yellow-400 text-black hover:bg-yellow-300 w-48')}
        >
          + 내전 만들기
        </Link>
        <div className="flex gap-3">
          <Link
            href="/rooms"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
          >
            내전 방 목록
          </Link>
          <Link
            href="/players"
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
          >
            플레이어 관리
          </Link>
        </div>
      </div>

    </div>
  )
}
