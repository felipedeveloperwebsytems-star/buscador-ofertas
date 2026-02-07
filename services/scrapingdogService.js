const axios = require('axios');

async function buscarAmazon(query) {
    const apiKey = process.env.SCRAPINGDOG_API_KEY;
    const storeId = "dryfour-20"; 

    try {
        console.log(`🌐 Scrapingdog: Iniciando busca por "${query}"...`);
        
        const response = await axios.get('https://api.scrapingdog.com/amazon/search', {
            params: {
                api_key: apiKey,
                query: query,
                page: 1,
                country: 'br',      
                domain: 'com.br',   
                premium: 'true'     
            },
            timeout: 20000 // Aumentado para 20s pois o modo premium pode demorar
        });

        // Verificação de segurança: a API pode retornar os dados em 'search_results'
        const products = response.data.search_results || [];

        if (products.length === 0) {
            console.log("⚠️ Scrapingdog retornou 0 produtos. Verifique se o termo existe na Amazon BR.");
            return [];
        }

        return products.map(item => {
            // Garante que o link seja absoluto
            let linkFinal = item.url || item.link;
            if (linkFinal && !linkFinal.includes('tag=')) {
                linkFinal += linkFinal.includes('?') ? `&tag=${storeId}` : `?tag=${storeId}`;
            }

            // Tratamento de Preço: a API às vezes envia só o número ou texto com símbolo
            let precoFormatado = item.price;
            if (typeof precoFormatado === 'number') {
                precoFormatado = `R$ ${precoFormatado.toLocaleString('pt-BR')}`;
            } else if (!precoFormatado) {
                precoFormatado = "Ver na Loja";
            }

            return {
                title: item.title || "Produto sem título",
                price: precoFormatado,
                link: linkFinal || "#",
                // A API pode usar 'image' ou 'thumbnail'
                thumbnail: item.image || item.thumbnail || 'https://via.placeholder.com/200?text=Sem+Imagem',
                store: "Amazon Brasil",
                isManual: false
            };
        });
    } catch (error) {
        // Se der erro de créditos ou chave, aparecerá aqui no log do Render
        console.error("❌ ERRO CRÍTICO SCRAPINGDOG:", error.response ? error.response.data : error.message);
        return [];
    }
}

module.exports = { buscarAmazon };