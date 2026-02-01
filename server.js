require('dotenv').config();
const express = require('express');
const cors = require('cors');
const afiliados = require('./linksAfiliados'); 
const { buscarLomadee } = require('./services/lomadeeService');

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
    const query = (req.query.q || "").toLowerCase();

    try {
        // 1. Busca Local (Links Manuais)
        let produtosManuais = [];
        if (afiliados && afiliados.produtos) {
            produtosManuais = afiliados.produtos
                .filter(p => (p.title || "").toLowerCase().includes(query))
                .map(p => ({ ...p, isManual: true }));
        }

        // 2. Busca na Lomadee
        const resultsLomadee = await buscarLomadee(query);

        // 3. Consolidação
        const todosProdutos = [...produtosManuais, ...resultsLomadee];
        res.json(todosProdutos);

    } catch (error) {
        console.error("Erro geral na busca:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

// Ajuste para o Render: ele define a porta automaticamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));