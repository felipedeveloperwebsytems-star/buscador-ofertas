const axios = require('axios');

async function buscarGoogleShopping(query) { // Mantive o nome da função para não quebrar o server.js
    const apiKey = process.env.SERPWOW_API_KEY;

    try {
        const response = await axios.get('https://api.serpwow.com/live/search', {
            params: {
                api_key: apiKey,
                q: query,
                engine: 'amazon', // Definindo o motor para Amazon
                amazon_domain: 'amazon.com.br',
                type: 'search'
            },
            timeout: 15000 
        });

        // O log do playground mostrou que os resultados vêm em "amazon_results"
        const products = response.data.amazon_results || [];

        return products.map(item => {
            // A SerpWow para Amazon usa "image" e "price.value" ou "price.raw"
            return {
                title: item.title,
                price: item.price ? item.price.raw : "Ver na Loja",
                link: item.link,
                thumbnail: item.image,
                store: "Amazon.com.br",
                isManual: false
            };
        });

    } catch (error) {
        console.error("ERRO SERPWOW (Amazon):", error.message);
        return [];
    }
}

module.exports = { buscarGoogleShopping };