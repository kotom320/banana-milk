alter table rooms
  add column if not exists scoring_rule text not null default 'standard'
  check (scoring_rule in ('standard', 'kill_focused', 'survival', 'competitive'));
