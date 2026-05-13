-- 점수 규칙을 DB에서 관리하기 위한 테이블
create table scoring_rule_configs (
  key text primary key,
  name text not null,
  description text not null,
  tooltip text not null default '',
  placements jsonb not null,  -- number[] (index 0 = 1위)
  kill_point numeric not null default 1,
  updated_at timestamptz not null default now()
);

-- 기본값 삽입
insert into scoring_rule_configs (key, name, description, tooltip, placements, kill_point) values
(
  'standard',
  '기본 내전룰',
  '1위 8점 · 킬당 1점',
  '우리 내전 기본 룰\n\n순위: 1위 8점 · 2위 4점 · 3위 3점 · 4위 2점 · 5위 1점 · 6위↓ 0점\n킬: 1킬당 1점\n\n킬과 생존 둘 다 중요한 밸런스형',
  '[8,4,3,2,1,0,0,0,0,0]',
  1
),
(
  'kill_focused',
  '킬 특화',
  '1위 8점 · 킬당 2점',
  '킬이 더 중요한 공격적인 룰\n\n순위: 1위 8점 · 2위 4점 · 3위 3점 · 4위 2점 · 5위 1점 · 6위↓ 0점\n킬: 1킬당 2점 (기본의 2배)\n\n공격형 캐리 플레이어에게 유리.\n치킨만 노리는 전략은 불리함',
  '[8,4,3,2,1,0,0,0,0,0]',
  2
),
(
  'survival',
  '생존 중심',
  '순위점수만 · 킬 없음',
  '오직 생존 순위만으로 승부\n\n순위: 1위 8점 · 2위 4점 · 3위 3점 · 4위 2점 · 5위 1점 · 6위↓ 0점\n킬: 점수 없음\n\n무리한 교전보다 존버 전략이 유리.\n치킨런너 타입에게 좋은 환경',
  '[8,4,3,2,1,0,0,0,0,0]',
  0
),
(
  'competitive',
  'PCS 대회룰',
  '1위 12점 · 킬당 1점',
  'PUBG 공식 PCS 대회 방식\n\n순위: 1위 12점 · 2위 9점 · 3위 7점\n4위 5점 · 5위 4점 · 6위 3점 · 7위 2점\n8위 1점 · 9위↓ 0점\n킬: 1킬당 1점\n\n1위 프리미엄이 크고 하위권은 0점.\n실력 차이가 잘 드러나는 룰',
  '[12,9,7,5,4,3,2,1,0,0]',
  1
);
