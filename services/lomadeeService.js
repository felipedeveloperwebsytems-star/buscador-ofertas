const axios = require('axios');
const https = require('https');

async function buscarLomadee(query) {
    // Agora pegando tudo do .env com segurança
    const token = process.env.LOMADEE_APP_TOKEN;
    const sourceId = process.env.LOMADEE_SOURCE_ID;

    if (!token || !sourceId) {
        console.error("ERRO: Chaves da Lomadee não configuradas no .env");
        return [];
    }

    try {
        const url = `https://api.lomadee.com/v3/${token}/product/_search`;
        const response = await axios.get(url, {
            params: {
                keyword: query,
                sourceId: sourceId,
                country: 'BR',
                size: 10
            }
        });

        const products = response.data.products || [];

        return products.map(item => ({
            title: item.name,
            price: item.priceMin ? `R$ ${item.priceMin.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : "Ver preço",
            link: item.link,
            thumbnail: item.thumbnail,
            store: item.store.name,
            isManual: false,
            apiSource: 'Lomadee'
        }));

    } catch (error) {
        console.error("ERRO NA API LOMADEE:", error.response ? error.response.status : error.message);
        return [];
    }
}

module.exports = { buscarLomadee };