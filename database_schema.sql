CREATE TABLE player_saves (
  player_id uuid PRIMARY KEY,
  coins bigint DEFAULT 0,
  owned_skins jsonb DEFAULT '["player1"]'::jsonb,
  selected_skin text DEFAULT 'player1',
  difficulty text DEFAULT 'normal',
  high_scores jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
