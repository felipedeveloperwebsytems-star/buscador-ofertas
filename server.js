require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const afiliados = require('./linksAfiliados'); 
const { buscarAmazon } = require('./services/rainforestService');

const app = express();
app.use(cors());
app.use(express.static('public'));

// CONFIGURAÇÃO REFORMULADA PARA EVITAR ERRO DE URL (COM CARACTERES ESPECIAIS)
const pool = new Pool({
    user: 'postgres.rdkybuxggdsbedkgjbqu',
    host: 'aws-1-sa-east-1.pooler.supabase.com', // Conforme o link do seu projeto
    database: 'postgres',
    password: process.env.DB_PASSWORD, // Lida com o # e a , sem quebrar
    port: 6543,
    ssl: { rejectUnauthorized: false },
    options: "-c project=rdkybuxggdsbedkgjbqu"
});

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json([]);

    try {
        console.log(`🔍 Iniciando busca por: ${query}`);

        // --- 1. BUSCA NO CACHE ---
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
        }

        if (produtosDoCache.length > 0) {
            console.log("🚀 CACHE: Produtos encontrados!");
            const manuais = afiliados.produtos.filter(p => 
                (p.title || "").toLowerCase().includes(query) || (p.keyword || "").toLowerCase().includes(query)
            ).map(p => ({ ...p, isManual: true }));

            return res.json([...manuais, ...produtosDoCache]);
        }

        // --- 2. BUSCA NA AMAZON ---
        console.log("💰 API AMAZON: Buscando dados novos...");
        const apiResults = await buscarAmazon(query).catch(() => []);

        // --- 3. SALVAR NO CACHE ---
        if (apiResults.length > 0) {
            await Promise.allSettled(apiResults.map(p => 
                pool.query(
                    `INSERT INTO cache_produtos (termo_busca, title, price, link, thumbnail, store) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [query, p.title, p.price, p.link, p.thumbnail, p.store]
                )
            ));
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

const PORT = process.env.PORT || 10000; // Ajustado para porta padrão do Render
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));