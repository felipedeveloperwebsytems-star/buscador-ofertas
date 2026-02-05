require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const afiliados = require('./linksAfiliados'); 
const { buscarAmazon } = require('./services/rainforestService');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Conexão simplificada para Neon.tech (funciona no Render e futuramente na Hostinger)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json([]);

    try {
        console.log(`🔍 Iniciando busca por: ${query}`);

        // --- 1. FILTRAR PRODUTOS MANUAIS (linksAfiliados.js) ---
        // Eles sempre são processados primeiro
        const manuais = afiliados.produtos.filter(p => 
            (p.title || "").toLowerCase().includes(query) || 
            (p.keyword || "").toLowerCase().includes(query)
        ).map(p => ({ ...p, isManual: true }));

        // --- 2. BUSCA NO CACHE (Neon) ---
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
            console.error("⚠️ Erro no Banco Neon:", dbError.message);
        }

        // Se achou no cache, soma com os manuais e envia
        if (produtosDoCache.length > 0) {
            console.log("🚀 CACHE: Resultados encontrados no Neon!");
            return res.json([...manuais, ...produtosDoCache]);
        }

        // --- 3. BUSCA NA AMAZON (Rainforest) ---
        console.log("💰 API AMAZON: Buscando dados novos...");
        const apiResults = await buscarAmazon(query).catch((err) => {
            console.error("❌ Erro na Rainforest:", err.message);
            return [];
        });

        // --- 4. SALVAR RESULTADOS DA API NO CACHE ---
        if (apiResults.length > 0) {
            // Salvamos no banco em segundo plano para não atrasar o usuário
            apiResults.forEach(p => {
                pool.query(
                    `INSERT INTO cache_produtos (termo_busca, title, price, link, thumbnail, store) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [query, p.title, p.price, p.link, p.thumbnail, p.store]
                ).catch(err => console.error("Erro ao salvar cache:", err.message));
            });
        }

        // --- 5. RESULTADO FINAL (SOMA) ---
        console.log(`✅ Busca finalizada. Manuais: ${manuais.length}, API: ${apiResults.length}`);
        res.json([...manuais, ...apiResults]);

    } catch (error) {
        console.error("Erro fatal na busca:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));