let produtosCache = [];
let paginaAtual = 1;
const itensPorPagina = 8;

// 1. Alternar Dropdown (Fecha os outros ao abrir)
function toggleDropdown(id) {
    const todos = document.getElementsByClassName("dropdown-content");
    for (let d of todos) {
        if (d.id !== id) d.classList.remove("show");
    }
    document.getElementById(id).classList.toggle("show");
}

// 2. Carregar Sidebar
async function carregarSidebar() {
    try {
        const response = await fetch('/api/search?q=amazon'); // Exemplo inicial
        const produtos = await response.json();
        
        const container = document.getElementById('nicho-tech');
        produtos.slice(0, 10).forEach(p => {
            const a = document.createElement('a');
            a.href = "#";
            a.textContent = p.title.substring(0, 20) + "...";
            a.onclick = (e) => { e.preventDefault(); exibirUm(p); };
            container.appendChild(a);
        });
    } catch (e) {}
}

async function buscarProdutos() {
    const q = document.getElementById('searchInput').value;
    const loading = document.getElementById('loading');
    loading.classList.remove('hidden');

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    produtosCache = await res.json();
    
    loading.classList.add('hidden');
    paginaAtual = 1;
    renderizarPagina();
}

function renderizarPagina() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const lista = produtosCache.slice(inicio, inicio + itensPorPagina);
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = "";

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = item.isManual ? 'card destaque' : 'card';
        card.innerHTML = `
            <img src="${item.thumbnail}" style="width:100%; height:150px; object-fit:contain">
            <h3 style="font-size:14px">${item.title.substring(0, 50)}...</h3>
            <p style="color:#2563eb; font-weight:bold">${item.price}</p>
            <p style="font-size:11px">${item.store}</p>
            <a href="${item.link}" target="_blank" style="display:block; background:#1e293b; color:white; text-align:center; padding:8px; border-radius:4px; text-decoration:none">Ver Loja</a>
        `;
        grid.appendChild(card);
    });
    
    atualizarPaginacao();
}

function mudarPagina(p) {
    paginaAtual += p;
    renderizarPagina();
    window.scrollTo(0,0);
}

function atualizarPaginacao() {
    const div = document.getElementById('pagination');
    if(produtosCache.length > itensPorPagina) {
        div.classList.remove('hidden');
        document.getElementById('pageIndicator').innerText = `Página ${paginaAtual}`;
        document.getElementById('btnPrev').disabled = paginaAtual === 1;
        document.getElementById('btnNext').disabled = paginaAtual * itensPorPagina >= produtosCache.length;
    } else {
        div.classList.add('hidden');
    }
}

function exibirUm(p) {
    produtosCache = [p];
    paginaAtual = 1;
    renderizarPagina();
}

document.addEventListener('DOMContentLoaded', carregarSidebar);