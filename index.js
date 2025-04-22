import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Mets la clé secrète côté backend uniquement !
);

app.post('/api/save-stats', async (req, res) => {
    const { matches } = req.body;
    if (!Array.isArray(matches) || matches.length === 0) {
        return res.status(400).json({ error: 'Bad data' });
    }

    // Pour debug : log les champs reçus
    console.log("Matches reçus :", matches);

    // On suppose que le front n'envoie QUE les stats du joueur connecté
    // On prend le pseudo du premier objet
    const pseudo = (matches[0].pseudo || '').trim();

    // Vérifie que ce pseudo existe dans la table profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', pseudo)
        .single();

    if (profileError || !profile) {
        return res.status(403).json({ error: `Pseudo non autorisé: ${pseudo}` });
    }

    // Ajoute le timestamp d'insertion
    const matchesToInsert = matches.map(m => ({
        ...m,
        inserted_at: new Date().toISOString()
    }));

    // Insertion sans doublon
    const { error } = await supabase
    .from('games')
    .upsert(matchesToInsert, { onConflict: ['match_id', 'pseudo'] });

    if (error) {
        console.error("Erreur insertion games :", error);
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
});

app.get('/', (req, res) => res.send('Marvel Backend OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API running on port', PORT));