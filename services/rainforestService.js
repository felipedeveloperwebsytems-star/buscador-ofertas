const axios = require('axios');

async function buscarAmazon(query) {
    const apiKey = process.env.RAINFOREST_API_KEY;
    const storeId = "dryfour-20"; // Sua Tag de Afiliado

    try {
        const response = await axios.get('https://api.rainforestapi.com/request', {
            params: {
                api_key: apiKey,
                type: 'search',
                amazon_domain: 'amazon.com.br',
                search_term: query,
                language: 'pt_BR',
                currency: 'BRL',
                customer_location: 'brazil'
            },
            timeout: 10000 
        });

        const products = response.data.search_results || [];

        return products.map(item => {
            // Lógica para injetar o link de afiliado
            let linkFinal = item.link;
            if (linkFinal) {
                linkFinal += linkFinal.includes('?') ? `&tag=${storeId}` : `?tag=${storeId}`;
            }

            return {
                title: item.title,
                price: item.price ? item.price.raw : "Ver na Loja",
                link: linkFinal,
                thumbnail: item.image,
                store: "Amazon Brasil",
                isManual: false
            };
        });

    } catch (error) {
        console.error("ERRO RAINFOREST:", error.message);
        return [];
    }
}

module.exports = { buscarAmazon };