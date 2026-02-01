const axios = require('axios');

async function buscarLomadee(query) {
    const token = process.env.LOMADEE_APP_TOKEN;
    const sourceId = process.env.LOMADEE_SOURCE_ID;

    // Verifica se as chaves existem para não dar erro no servidor
    if (!token || !sourceId) {
        console.error("ERRO: Chaves da Lomadee não encontradas no Environment do Render.");
        return [];
    }

    try {
        // URL Oficial da Lomadee (sem o ponto e vírgula dentro)
        const url = `https://api.lomadee.com/v3/${token}/product/_search`;
        
        const response = await axios.get(url, {
            params: {
                sourceId: sourceId,
                keyword: query,
                country: 'BR',
                size: 12 // Trazemos 12 produtos para ficar bonito na grade
            },
            timeout: 10000 // Se a API não responder em 10 segundos, ele desiste
        });

        // Verifica se a API retornou produtos
        const products = response.data.products || [];

        return products.map(item => ({
            title: item.name,
            price: item.priceMin ? item.priceMin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "Ver preço",
            link: item.link,
            thumbnail: item.thumbnail,
            store: item.store ? item.store.name : "Loja",
            isManual: false
        }));

    } catch (error) {
        // Log detalhado para sabermos se o erro é de rede ou de permissão
        if (error.response) {
            console.error(`ERRO API LOMADEE (Status ${error.response.status}):`, error.response.data);
        } else {
            console.error("ERRO DE CONEXÃO LOMADEE:", error.message);
        }
        return [];
    }
}

module.exports = { buscarLomadee };