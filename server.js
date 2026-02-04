require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const afiliados = require('./linksAfiliados'); 
const { buscarLomadee } = require('./services/lomadeeService');
const { buscarAmazon } = require('./services/rainforestService');

const app = express();
app.use(cors());
app.use(express.static('public'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json([]);

    try {
        console.log(`🔍 Iniciando busca por: ${query}`);

        // --- 1. BUSCA NO CACHE (COM PROTEÇÃO) ---
        let produtosDoCache = [];
        try {
            const cacheQuery = `
                SELECT title, price, link, thumbnail, store FROM cache_produtos 
                WHERE termo_busca = $1 
                AND data_criacao > NOW() - INTERVAL '1 day'
            `;
            const cacheResult = await pool.query(cacheQuery, [query]);
            produtosDoCache = cacheResult.rows;
        } catch (dbError) {
            console.error("⚠️ Erro no Banco (Ignorando cache):", dbError.message);
            // Se o banco der erro, não travamos o site, apenas seguimos para as APIs
        }

        if (produtosDoCache.length > 0) {
            console.log("🚀 CACHE: Produtos encontrados!");
            const manuais = afiliados.produtos.filter(p => 
                (p.title || "").toLowerCase().includes(query) || (p.keyword || "").toLowerCase().includes(query)
            ).map(p => ({ ...p, isManual: true }));

            return res.json([...manuais, ...produtosDoCache]);
        }

        // --- 2. BUSCA NAS APIS ---
        console.log("💰 APIs: Buscando dados novos...");
        const [resultsLomadee, resultsAmazon] = await Promise.all([
            buscarLomadee(query).catch(() => []),
            buscarAmazon(query).catch(() => [])
        ]);

        const apiResults = [...resultsAmazon, ...resultsLomadee];

        // --- 3. SALVAR NO CACHE (EM SEGUNDO PLANO) ---
        if (apiResults.length > 0) {
            // Tentamos salvar, mas se falhar, o usuário recebe os produtos do mesmo jeito
            apiResults.forEach(async (p) => {
                try {
                    await pool.query(
                        `INSERT INTO cache_produtos (termo_busca, title, price, link, thumbnail, store) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [query, p.title, p.price, p.link, p.thumbnail, p.store]
                    );
                } catch (e) { /* silencia erro de inserção */ }
            });
        }

        const manuais = afiliados.produtos.filter(p => 
            (p.title || "").toLowerCase().includes(query) || (p.keyword || "").toLowerCase().includes(query)
        ).map(p => ({ ...p, isManual: true }));

        res.json([...manuais, ...apiResults]);

    } catch (error) {
        console.error("Erro fatal na busca:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));