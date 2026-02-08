let produtosAtuais = [];

async function buscarProdutos() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    const loading = document.getElementById('loading');
    const progressBar = document.getElementById('progressBar');
    const grid = document.getElementById('resultsGrid');

    if (!query) return;

    grid.innerHTML = '';
    loading.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 15; 
            progressBar.style.width = `${progress}%`;
        }
    }, 200);

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        clearInterval(interval);
        progressBar.style.width = '100%';

        setTimeout(() => {
            loading.classList.add('hidden');
            produtosAtuais = data;
            exibirProdutos(data);
        }, 400);

    } catch (error) {
        clearInterval(interval);
        console.error("Erro na busca:", error);
        loading.innerHTML = "Erro ao buscar ofertas.";
    }
}

function exibirProdutos(produtos) {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';

    if (produtos.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; padding: 50px;">Nenhuma oferta encontrada. Tente outro termo!</p>';
        return;
    }

    produtos.forEach(p => {
        const card = document.createElement('div');
        card.className = `card ${p.isManual ? 'destaque' : ''}`;
        
        card.innerHTML = `
            <img src="${p.thumbnail || 'https://via.placeholder.com/200'}" alt="${p.title}">
            <h3>${p.title}</h3>
            <p class="price">${p.price}</p>
            <p class="store">📦 ${p.store}</p>
            <a href="${p.link}" target="_blank">IR PARA LOJA</a>
        `;
        grid.appendChild(card);
    });
}

function ordenarProdutos(tipo) {
    if (produtosAtuais.length === 0) return;
    const ordenados = [...produtosAtuais].sort((a, b) => {
        const precoA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.'));
        const precoB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.'));
        return tipo === 'menor' ? precoA - precoB : precoB - precoA;
    });
    exibirProdutos(ordenados);
}

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarProdutos();
});