const axios = require('axios');

async function buscarGoogleShopping(query) { 
    // Pega a chave da API das variáveis de ambiente
    const apiKey = process.env.SERPWOW_API_KEY;
    
    // Seu ID de Associado Amazon
    const affiliateId = "dryfour-20"; 

    try {
        console.log(`🔧 Iniciando busca na Amazon para: "${query}" usando ID: ${affiliateId}`);

        const response = await axios.get('https://api.serpwow.com/live/search', {
            params: {
                api_key: apiKey,
                q: query,
                engine: 'amazon',
                amazon_domain: 'amazon.com.br',
                type: 'search'
            },
            timeout: 30000 
        });

        // Os resultados da Amazon na SerpWow vêm nesta chave
        const products = response.data.amazon_results || [];

        const produtosFormatados = products.map(item => {
            let linkFinal = item.link;
            
            if (linkFinal) {
                // Remove qualquer tag= existente para não duplicar ou dar erro
                const urlBase = linkFinal.split('tag=')[0];
                
                // Remove caracteres extras que podem sobrar no final (& ou ?)
                const urlLimpa = urlBase.replace(/[&?]$/, '');
                
                // Adiciona o seu ID de afiliado de forma limpa
                const separador = urlLimpa.includes('?') ? '&' : '?';
                linkFinal = `${urlLimpa}${separador}tag=${affiliateId}`;
            }

            return {
                title: item.title,
                price: item.price ? item.price.raw : "Ver na Loja",
                link: linkFinal, 
                thumbnail: item.image,
                store: "Amazon.com.br",
                isManual: false
            };
        });

        console.log(`✅ Sucesso! ${produtosFormatados.length} produtos processados com ID de afiliado.`);
        return produtosFormatados;

    } catch (error) {
        console.error("❌ ERRO NA SERPWOW:", error.message);
        return [];
    }
}

module.exports = { buscarGoogleShopping };