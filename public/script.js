let produtosCache = []; 

async function buscarProdutos() {
    const query = document.getElementById('searchInput').value;
    const grid = document.getElementById('resultsGrid');
    const loading = document.getElementById('loading');

    if (!query) return alert('Digite algo para buscar!');

    grid.innerHTML = '';
    loading.classList.remove('hidden');

    try {
        // Busca na nossa API (que agora traz Amazon + Lomadee + Manuais)
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        loading.classList.add('hidden');
        
        // Se a API retornar erro ou não for um array, tratamos aqui
        if (data.error) {
            grid.innerHTML = `<p>Erro: ${data.error}</p>`;
            return;
        }

        produtosCache = data; 
        renderizarCards(produtosCache);

    } catch (error) {
        loading.classList.add('hidden');
        grid.innerHTML = '<p>Erro ao conectar com o servidor.</p>';
        console.error(error);
    }
}

function renderizarCards(lista) {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';

    if (!Array.isArray(lista) || lista.length === 0) {
        grid.innerHTML = '<p>Nenhum produto encontrado. Tente outro termo!</p>';
        return;
    }

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = item.isManual ? 'card destaque' : 'card';
        
        const imagem = item.thumbnail || 'https://via.placeholder.com/200?text=Sem+Imagem';

        // Melhoria: Limitar o título se for muito grande (comum na Amazon)
        const tituloCurto = item.title.length > 60 ? item.title.substring(0, 60) + '...' : item.title;

        card.innerHTML = `
            <img src="${imagem}" alt="${item.title}" loading="lazy">
            <h3 title="${item.title}">${tituloCurto}</h3>
            <p class="price">${item.price}</p>
            <p class="store">Loja: ${item.store}</p>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">Ver na Loja</a>
        `;
        grid.appendChild(card);
    });
}

function ordenarProdutos(criterio) {
    if (produtosCache.length === 0) return;

    const listaOrdenada = [...produtosCache].sort((a, b) => {
        const extrairPreco = (p) => {
            if (!p || typeof p !== 'string') return 0;
            // Remove R$, pontos de milhar e converte vírgula em ponto
            // Ex: "R$ 1.250,00" -> "1250.00"
            const numerico = p.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            return parseFloat(numerico) || 0;
        };
        const precoA = extrairPreco(a.price);
        const precoB = extrairPreco(b.price);
        
        return criterio === 'menor' ? precoA - precoB : precoB - precoA;
    });
    renderizarCards(listaOrdenada);
}

// Evento para o Enter
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarProdutos();
});