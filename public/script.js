let produtosCache = [];
let paginaAtual = 1;

function openTab(evt, tabId) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.className += " active";
}

async function buscarProdutos() {
    const q = document.getElementById('searchInput').value;
    if(!q) return;

    // Garante que a aba de resultados abra ao buscar
    document.querySelector('[onclick*="results-section"]').click();

    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');
    
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    produtosCache = await res.json();
    
    loading.classList.add('hidden');
    paginaAtual = 1;
    renderizarPagina();
}

function renderizarPagina() {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = "";
    produtosCache.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${item.thumbnail}" style="width:100%">
            <h4>${item.title.substring(0, 40)}...</h4>
            <p>${item.price}</p>
            <a href="${item.link}" target="_blank">Ver Loja</a>
        `;
        grid.appendChild(card);
    });
}