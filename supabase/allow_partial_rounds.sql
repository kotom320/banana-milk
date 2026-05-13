-- 팀별 개별 입력을 위해 team1/team2 placement, kills 를 nullable로 변경
ALTER TABLE round_results ALTER COLUMN team1_placement DROP NOT NULL;
ALTER TABLE round_results ALTER COLUMN team1_kills DROP NOT NULL;
ALTER TABLE round_results ALTER COLUMN team2_placement DROP NOT NULL;
ALTER TABLE round_results ALTER COLUMN team2_kills DROP NOT NULL;
