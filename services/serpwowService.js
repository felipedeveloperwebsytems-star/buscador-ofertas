const axios = require('axios');

async function buscarGoogleShopping(query) { 
    const apiKey = process.env.SERPWOW_API_KEY;

    try {
        const response = await axios.get('https://api.serpwow.com/live/search', {
            params: {
                api_key: apiKey,
                q: query,
                engine: 'amazon',
                amazon_domain: 'amazon.com.br',
                type: 'search'
            },
            timeout: 30000 // Aumentado para 30s para evitar o erro de timeout no Render
        });

        // O seu teste curl confirmou que os dados vêm em amazon_results
        const products = response.data.amazon_results || [];

        return products.map(item => {
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