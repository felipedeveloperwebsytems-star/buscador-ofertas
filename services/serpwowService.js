const axios = require('axios');

async function buscarGoogleShopping(query) { 
    // Pega a chave da API das variáveis de ambiente do Render
    const apiKey = process.env.SERPWOW_API_KEY;
    
    // Seu ID de Associado Amazon conforme o relatório que você enviou
    const affiliateId = "dryfour-20"; 

    try {
        const response = await axios.get('https://api.serpwow.com/live/search', {
            params: {
                api_key: apiKey,
                q: query,
                engine: 'amazon',
                amazon_domain: 'amazon.com.br',
                type: 'search'
            },
            timeout: 30000 // Tempo de espera de 30s para evitar erros no Render
        });

        // Os resultados da SerpWow para o motor Amazon vêm dentro de 'amazon_results'
        const products = response.data.amazon_results || [];

        return products.map(item => {
            // Lógica para injetar o seu ID de afiliado no link original da Amazon
            let linkFinal = item.link;
            
            if (linkFinal && !linkFinal.includes('tag=')) {
                // Verifica se o link já possui parâmetros (usa ?) ou se vamos adicionar o primeiro (usa &)
                const separador = linkFinal.includes('?') ? '&' : '?';
                linkFinal = `${linkFinal}${separador}tag=${affiliateId}`;
            }

            return {
                title: item.title,
                price: item.price ? item.price.raw : "Ver na Loja",
                link: linkFinal, // Link agora rastreável para sua conta de associado
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