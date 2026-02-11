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

// função do navbar modulo
// ... (mantenha as funções buscarProdutos, exibirProdutos e ordenarProdutos como estão)

// Função do Navbar Módulo (Otimizada)
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const wrapper = document.querySelector(".df-custom-select-wrapper");
        if (!wrapper) return;

        const realSelect = wrapper.querySelector("select");
        if (!realSelect) return;
        
        // 1. Criar elemento visual selecionado
        const selectedDiv = document.createElement("DIV");
        selectedDiv.className = "df-selected";
        selectedDiv.innerHTML = realSelect.options[realSelect.selectedIndex].innerHTML;
        wrapper.appendChild(selectedDiv);

        // 2. Criar container dos itens
        const itemsContainer = document.createElement("DIV");
        itemsContainer.className = "df-items df-hide";

        // Começamos do 1 para pular o "Em Destaque" se desejar, ou 0 para incluir todos
        for (let i = 0; i < realSelect.length; i++) {
            const opt = realSelect.options[i];
            const item = document.createElement("DIV");
            
            // Limpa o texto (remove espaços extras)
            const cleanText = opt.text.trim();
            item.innerHTML = cleanText;

            if (opt.value === "parent") {
                item.className = "df-is-parent";
                item.setAttribute("data-nicho", opt.getAttribute("data-nicho"));
                item.innerHTML += ' <i class="fas fa-chevron-right" style="float:right; font-size:10px; margin-top:3px; opacity:0.5;"></i>';
            } else if (opt.value === "sub") {
                item.className = "df-is-sub";
                item.setAttribute("data-parent", opt.getAttribute("data-parent"));
            } else {
                item.className = "df-item-default"; // Para o "Em Destaque"
            }

            item.addEventListener("click", function(e) {
                e.stopPropagation();
                
                if (this.classList.contains("df-is-parent")) {
                    const target = this.getAttribute("data-nicho");
                    // Lógica de acordeão
                    itemsContainer.querySelectorAll(".df-is-sub").forEach(sub => {
                        if (sub.getAttribute("data-parent") === target) {
                            sub.classList.toggle("df-show");
                        } else {
                            sub.classList.remove("df-show");
                        }
                    });
                } else {
                    // SELEÇÃO DE UM PRODUTO (SUB OU DEFAULT)
                    const termoEscolhido = this.innerText.replace('new', '').trim();
                    selectedDiv.innerHTML = this.innerHTML;
                    fecharDropdown();
                    
                    // Atualiza o input visível e dispara a busca
                    const inputBusca = document.getElementById('searchInput');
                    if(inputBusca) {
                        inputBusca.value = termoEscolhido;
                        // Chama a função global que você já tem no script.js
                        buscarProdutos(); 
                    }
                }
            });
            itemsContainer.appendChild(item);
        }

        wrapper.appendChild(itemsContainer);

        function fecharDropdown() {
            itemsContainer.classList.add("df-hide");
            selectedDiv.classList.remove("df-arrow-active");
        }

        selectedDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            const estaEscondido = itemsContainer.classList.contains("df-hide");
            if (estaEscondido) {
                itemsContainer.classList.remove("df-hide");
                selectedDiv.classList.add("df-arrow-active");
            } else {
                fecharDropdown();
            }
        });

        window.addEventListener("click", fecharDropdown);
    });
})();
