const axios = require('axios');

async function buscarAmazon(query) {
    const apiKey = process.env.SCRAPINGDOG_API_KEY;
    const storeId = "dryfour-20"; 

    try {
        const response = await axios.get('https://api.scrapingdog.com/amazon/search', {
            params: {
                api_key: apiKey,
                query: query,
                page: 1,
                country: 'br',      // Adaptado do snippet para BR
                domain: 'com.br',   // Adaptado do snippet para BR
                premium: 'true'     // Conforme seu snippet
            },
            timeout: 15000 
        });

        const products = response.data.search_results || [];

        return products.map(item => {
            let linkFinal = item.url;
            if (linkFinal && !linkFinal.includes('tag=')) {
                linkFinal += linkFinal.includes('?') ? `&tag=${storeId}` : `?tag=${storeId}`;
            }

            return {
                title: item.title,
                price: item.price ? `R$ ${item.price}` : "Ver na Loja",
                link: linkFinal,
                thumbnail: item.image,
                store: "Amazon Brasil",
                isManual: false
            };
        });
    } catch (error) {
        console.error("ERRO SCRAPINGDOG:", error.message);
        return [];
    }
}

module.exports = { buscarAmazon };