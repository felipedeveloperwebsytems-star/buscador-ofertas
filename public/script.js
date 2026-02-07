let produtosCache = [];
let paginaAtual = 1;
const itensPorPagina = 8;

function toggleDropdown(id) {
    const todos = document.getElementsByClassName("dropdown-content");
    for (let d of todos) {
        if (d.id !== id) d.classList.remove("show");
    }
    document.getElementById(id).classList.toggle("show");
}

// Corrigido: Agora apenas popula os nomes, sem disparar "Buscando..."
async function carregarSidebar() {
    try {
        const res = await fetch('/api/afiliados-nichos'); 
        const nichos = await res.json();
        
        const container = document.getElementById('nicho-tech');
        nichos.slice(0, 10).forEach(p => {
            const a = document.createElement('a');
            a.href = "#";
            a.textContent = p.title.substring(0, 25);
            a.onclick = (e) => { e.preventDefault(); exibirUm(p); };
            container.appendChild(a);
        });
    } catch (e) { console.error("Erro sidebar:", e); }
}

async function buscarProdutos() {
    const q = document.getElementById('searchInput').value;
    if(!q) return;

    const loading = document.getElementById('loading');
    const grid = document.getElementById('resultsGrid');
    
    grid.innerHTML = ""; // Limpa resultados anteriores
    loading.classList.remove('hidden'); // Mostra o loading SÓ agora

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        produtosCache = await res.json();
        paginaAtual = 1;
        renderizarPagina();
    } catch (err) {
        console.error("Erro na busca:", err);
    } finally {
        loading.classList.add('hidden'); // Esconde o loading ao terminar
    }
}

// Função de Ordenação
function ordenarProdutos(tipo) {
    if (produtosCache.length === 0) return;
    
    produtosCache.sort((a, b) => {
        const precoA = parseFloat(String(a.price).replace(/[^\d,]/g, '').replace(',', '.'));
        const precoB = parseFloat(String(b.price).replace(/[^\d,]/g, '').replace(',', '.'));
        return tipo === 'menor' ? precoA - precoB : precoB - precoA;
    });
    
    paginaAtual = 1;
    renderizarPagina();
}

function renderizarPagina() {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = "";
    
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const lista = produtosCache.slice(inicio, inicio + itensPorPagina);

    if (lista.length === 0) {
        grid.innerHTML = "<p>Nenhuma oferta encontrada para este termo.</p>";
        return;
    }

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = item.isManual ? 'card destaque' : 'card';
        card.innerHTML = `
            <img src="${item.thumbnail}" style="width:100%; height:150px; object-fit:contain">
            <h3 style="font-size:14px">${item.title.substring(0, 60)}...</h3>
            <p style="color:#2563eb; font-weight:bold">${item.price}</p>
            <p style="font-size:11px">${item.store}</p>
            <a href="${item.link}" target="_blank" style="display:block; background:#1e293b; color:white; text-align:center; padding:8px; border-radius:4px; text-decoration:none">Ver Loja</a>
        `;
        grid.appendChild(card);
    });
    atualizarPaginacao();
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

function mudarPagina(p) {
    paginaAtual += p;
    renderizarPagina();
}

function exibirUm(p) {
    produtosCache = [p];
    paginaAtual = 1;
    renderizarPagina();
}

document.addEventListener('DOMContentLoaded', carregarSidebar);