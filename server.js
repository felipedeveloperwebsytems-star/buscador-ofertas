require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const afiliados = require('./linksAfiliados'); 
const { buscarGoogleShopping } = require('./services/serpwowService');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Configuração otimizada para o Banco Neon
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { 
        rejectUnauthorized: false 
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json([]);

    try {
        console.log(`🔍 Buscando por: "${query}"`);

        // 1. FILTRAR PRODUTOS MANUAIS
        const manuais = afiliados.produtos.filter(p => 
            (p.title || "").toLowerCase().includes(query) || 
            (p.keyword || "").toLowerCase().includes(query)
        ).map(p => ({ ...p, isManual: true }));

        // 2. BUSCA NO CACHE (Neon)
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
            console.error("⚠️ Erro ao ler Banco Neon:", dbError.message);
        }

        if (produtosDoCache.length > 0) {
            console.log(`🚀 CACHE: Encontrado para "${query}"!`);
            return res.json([...manuais, ...produtosDoCache]);
        }

        // 3. BUSCA NA SERPWOW (Se não houver cache)
        console.log("💰 API SERPWOW: Chamando API externa...");
        const apiResults = await buscarGoogleShopping(query).catch((err) => {
            console.error("❌ Erro na SerpWow:", err.message);
            return [];
        });

        // 4. SALVAR NO CACHE (Aguardando conclusão para garantir gravação)
        if (apiResults.length > 0) {
            try {
                const savePromises = apiResults.map(p => {
                    return pool.query(
                        `INSERT INTO cache_produtos (termo_busca, title, price, link, thumbnail, store) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [query, p.title, p.price, p.link, p.thumbnail, p.store]
                    );
                });
                await Promise.all(savePromises);
                console.log(`💾 Banco Neon: Cache gravado para "${query}"`);
            } catch (saveError) {
                console.error("❌ Erro ao gravar no banco:", saveError.message);
            }
        }

        console.log(`✅ Busca finalizada. Totais: Manuais: ${manuais.length}, API: ${apiResults.length}`);
        res.json([...manuais, ...apiResults]);

    } catch (error) {
        console.error("Erro fatal no servidor:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 Conexão com Banco de Dados: ${process.env.DATABASE_URL ? "Configurada" : "Faltando"}`);
});