import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Mets la clé secrète côté backend uniquement !
);

app.post('/api/save-stats', async (req, res) => {
  const { matches } = req.body;
  if (!Array.isArray(matches)) return res.status(400).json({ error: 'Bad data' });

  // Exemple d'insertion en bulk (adapte la table et les champs à ta BDD Supabase)
  const { error } = await supabase.from('games').insert(matches);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

app.get('/', (req, res) => res.send('Marvel Backend OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API running on port', PORT));