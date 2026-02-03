require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Importa o driver do PostgreSQL
const afiliados = require('./linksAfiliados'); 
const { buscarLomadee } = require('./services/lomadeeService');
const { buscarAmazon } = require('./services/rainforestService');

const app = express();
app.use(cors());
app.use(express.static('public'));

// Configuração da Conexão com Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necessário para conexões seguras no Render/Supabase
});

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase().trim();
    if (!query) return res.json([]);

    try {
        console.log(`🔍 Iniciando busca por: ${query}`);

        // --- 1. BUSCA NO CACHE (SUPABASE) ---
        // Verifica se temos essa busca salva nas últimas 24 horas
        const cacheQuery = `
            SELECT * FROM cache_produtos 
            WHERE termo_busca = $1 
            AND data_criacao > NOW() - INTERVAL '1 day'
        `;
        const cacheResult = await pool.query(cacheQuery, [query]);

        if (cacheResult.rows.length > 0) {
            console.log("🚀 CACHE: Produtos encontrados no banco (Economizando créditos!)");
            
            // Adicionamos os manuais mesmo quando vem do cache para garantir que suas ofertas "ouro" apareçam
            let produtosManuais = afiliados.produtos.filter(p => 
                (p.title || "").toLowerCase().includes(query) || (p.keyword || "").toLowerCase().includes(query)
            ).map(p => ({ ...p, isManual: true }));

            return res.json([...produtosManuais, ...cacheResult.rows]);
        }

        // --- 2. SE NÃO TEM NO CACHE, BUSCA NAS APIS ---
        console.log("💰 APIs: Buscando dados novos (Gastando créditos)...");
        const [resultsLomadee, resultsAmazon] = await Promise.all([
            buscarLomadee(query).catch(err => { console.error("Erro Lomadee:", err.message); return []; }),
            buscarAmazon(query).catch(err => { console.error("Erro Amazon:", err.message); return []; })
        ]);

        // --- 3. BUSCA LOCAL (MANUAIS) ---
        const produtosManuais = afiliados.produtos.filter(p => 
            (p.title || "").toLowerCase().includes(query) || (p.keyword || "").toLowerCase().includes(query)
        ).map(p => ({ ...p, isManual: true }));

        const apiResults = [...resultsAmazon, ...resultsLomadee];

        // --- 4. SALVAR RESULTADOS NO CACHE (SUPABASE) ---
        if (apiResults.length > 0) {
            // Salva cada produto da API no banco para a próxima vez
            for (const p of apiResults) {
                const insertQuery = `
                    INSERT INTO cache_produtos (termo_busca, title, price, link, thumbnail, store)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                await pool.query(insertQuery, [query, p.title, p.price, p.link, p.thumbnail, p.store]);
            }
        }

        const todosProdutos = [...produtosManuais, ...apiResults];
        console.log(`✅ Busca finalizada. Total: ${todosProdutos.length}`);
        res.json(todosProdutos);

    } catch (error) {
        console.error("Erro geral na rota de busca:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));