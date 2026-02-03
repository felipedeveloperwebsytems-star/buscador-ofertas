require('dotenv').config();
const express = require('express');
const cors = require('cors');
const afiliados = require('./linksAfiliados'); 
const { buscarLomadee } = require('./services/lomadeeService');
const { buscarAmazon } = require('./services/rainforestService'); // IMPORTANTE: Importar o novo serviço

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase();

    if (!query) {
        return res.json([]);
    }

    try {
        console.log(`Iniciando busca por: ${query}`);

        // 1. Busca em Paralelo (Lomadee e Amazon ao mesmo tempo)
        // Isso ganha performance, pois o servidor não espera uma acabar para começar a outra.
        const [resultsLomadee, resultsAmazon] = await Promise.all([
            buscarLomadee(query).catch(err => {
                console.error("Erro na Lomadee:", err.message);
                return []; // Se a Lomadee falhar, retorna vazio mas não trava o resto
            }),
            buscarAmazon(query).catch(err => {
                console.error("Erro na Amazon/Rainforest:", err.message);
                return []; // Se a Amazon falhar, retorna vazio mas não trava o resto
            })
        ]);

        // 2. Busca Local (Links Manuais de Afiliados)
        let produtosManuais = [];
        if (afiliados && afiliados.produtos) {
            produtosManuais = afiliados.produtos
                .filter(p => (p.title || "").toLowerCase().includes(query) || (p.keyword || "").toLowerCase().includes(query))
                .map(p => ({ ...p, isManual: true }));
        }

        // 3. Consolidação e Ordem de Exibição
        // Ordem: 1º Seus links manuais (ouro), 2º Amazon, 3º Lomadee
        const todosProdutos = [
            ...produtosManuais, 
            ...resultsAmazon, 
            ...resultsLomadee
        ];

        console.log(`Busca finalizada. Total de produtos: ${todosProdutos.length}`);
        res.json(todosProdutos);

    } catch (error) {
        console.error("Erro geral na rota de busca:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

// Ajuste para o Render: ele define a porta automaticamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor DryFour rodando na porta ${PORT}`));