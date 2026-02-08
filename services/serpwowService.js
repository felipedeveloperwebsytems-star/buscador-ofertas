const axios = require('axios');

async function buscarGoogleShopping(query) {
    const apiKey = process.env.SERPWOW_API_KEY;

    try {
        const response = await axios.get('https://api.serpwow.com/live/search', {
            params: {
                api_key: apiKey,
                q: query,
                search_type: 'shopping',
                google_domain: 'google.com.br',
                location: 'Brazil',
                gl: 'br',
                hl: 'pt',
                page: '1'
            },
            timeout: 15000 
        });

        // A SerpWow retorna os resultados em shopping_results
        const products = response.data.shopping_results || [];

        return products.map(item => {
            return {
                title: item.title,
                price: item.price ? item.price : "Ver na Loja",
                link: item.link,
                thumbnail: item.image,
                store: item.source || "Loja Online",
                isManual: false
            };
        });

    } catch (error) {
        console.error("ERRO SERPWOW:", error.message);
        return [];
    }
}

module.exports = { buscarGoogleShopping };