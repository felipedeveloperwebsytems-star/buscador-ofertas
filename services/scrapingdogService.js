const axios = require('axios');

async function buscarAmazon(query) {
    const params = {  
        api_key: '6986a6366673282feb2173b0',  
        query: query,
        page: 1,  
        country: 'br',  
        domain: 'com.br',  
        premium: 'false' // Usando false conforme seu snippet para economizar créditos
    };

    try {
        const response = await axios.get('https://api.scrapingdog.com/amazon/search', { params });
        const products = response.data.search_results || [];

        return products.map(item => ({
            title: item.title,
            price: item.price || "Ver na Loja",
            link: item.url || item.link,
            thumbnail: item.image || item.thumbnail,
            store: "Amazon Brasil"
        }));
    } catch (error) {
        console.error('Erro na Scrapingdog:', error.message);
        return [];
    }
}
module.exports = { buscarAmazon };