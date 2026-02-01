let produtosCache = []; 

async function buscarProdutos() {
    const query = document.getElementById('searchInput').value;
    const grid = document.getElementById('resultsGrid');
    const loading = document.getElementById('loading');

    if (!query) return alert('Digite algo para buscar!');

    grid.innerHTML = '';
    loading.classList.remove('hidden');

    try {
        // AJUSTE: Removido "http://localhost:3000" para funcionar em qualquer lugar
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        loading.classList.add('hidden');
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

        card.innerHTML = `
            <img src="${imagem}" alt="${item.title}">
            <h3>${item.title}</h3>
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
            const numerico = p.replace(/[^\d,]/g, '').replace(',', '.');
            return parseFloat(numerico) || 0;
        };
        const precoA = extrairPreco(a.price);
        const precoB = extrairPreco(b.price);
        return criterio === 'menor' ? precoA - precoB : precoB - precoA;
    });
    renderizarCards(listaOrdenada);
}