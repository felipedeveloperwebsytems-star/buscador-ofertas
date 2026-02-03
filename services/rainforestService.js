const axios = require('axios');

async function buscarAmazon(query) {
    const apiKey = process.env.RAINFOREST_API_KEY;

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

        // Conforme você viu no playground, os itens ficam em "search_results"
        const products = response.data.search_results || [];

        return products.map(item => ({
            title: item.title,
            price: item.price ? item.price.raw : "Ver na Loja",
            link: item.link,
            thumbnail: item.image, // Rainforest usa .image para a foto principal
            store: "Amazon Brasil",
            isManual: false
        }));

    } catch (error) {
        console.error("ERRO RAINFOREST:", error.message);
        return [];
    }
}

module.exports = { buscarAmazon };