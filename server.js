require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const afiliados = require('./linksAfiliados'); 
const { buscarAmazon } = require('./services/scrapingdogService');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Configuração do Banco de Dados Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Endpoint para alimentar os nichos do Sidebar (puxa do linksAfiliados.js)
app.get('/api/afiliados-nichos', (req, res) => {
    try {
        res.json(afiliados.produtos);
    } catch (error) {
        res.status(500).json({ error: "Erro ao carregar nichos" });
    }
});

// Endpoint Principal de Busca
app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json([]);

    try {
        console.log(`🔍 Buscando: ${query}`);

        // --- 1. PRODUTOS MANUAIS (Prioridade Máxima) ---
        const manuais = afiliados.produtos.filter(p => 
            (p.title || "").toLowerCase().includes(query) || 
            (p.keyword || "").toLowerCase().includes(query)
        ).map(p => ({ ...p, isManual: true }));

        // --- 2. CONSULTA AO CACHE (Neon) ---
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
            console.error("⚠️ Erro Banco Neon:", dbError.message);
        }

        // Se houver resultados no cache, retorna imediatamente
        if (produtosDoCache.length > 0) {
            console.log("🚀 Resultados vindos do Cache Neon");
            return res.json([...manuais, ...produtosDoCache]);
        }

        // --- 3. BUSCA EXTERNA (Scrapingdog) ---
        console.log("🌐 Chamando Scrapingdog API...");
        const apiResults = await buscarAmazon(query).catch((err) => {
            console.error("❌ Erro Scrapingdog:", err.message);
            return [];
        });

        // --- 4. SALVAR NO CACHE EM BACKGROUND ---
        if (apiResults.length > 0) {
            apiResults.forEach(p => {
                pool.query(
                    `INSERT INTO cache_produtos (termo_busca, title, price, link, thumbnail, store) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [query, p.title, p.price, p.link, p.thumbnail, p.store]
                ).catch(err => console.error("Erro ao salvar cache:", err.message));
            });
        }

        // Retorno Final (Manuais + API)
        res.json([...manuais, ...apiResults]);

    } catch (error) {
        console.error("Erro fatal:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

// Porta configurada para o Render (10000) ou Local (3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 DryFour rodando em: https://buscador-ofertas-e6dp.onrender.com/`);
    console.log(`📡 Porta ativa: ${PORT}`);
});