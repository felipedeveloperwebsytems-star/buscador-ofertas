let produtosAtuais = [];

// 1. Função Principal de Busca
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
        loading.innerHTML = '<p style="color:white; text-align:center;">Erro ao conectar com o servidor.</p>';
    }
}

// 2. Renderização dos Cards
function exibirProdutos(produtos) {
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = '';

    if (produtos.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; padding: 50px; color: #666;">Nenhuma oferta encontrada. Tente outro termo!</p>';
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

// 3. Ordenação
function ordenarProdutos(tipo) {
    if (produtosAtuais.length === 0) return;
    const ordenados = [...produtosAtuais].sort((a, b) => {
        const precoA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.'));
        const precoB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.'));
        return tipo === 'menor' ? precoA - precoB : precoB - precoA;
    });
    exibirProdutos(ordenados);
}

// 4. Suporte para Enter
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') buscarProdutos();
        });
    }
});

// 5. Módulo do Custom Select (Navegação por Nichos)
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const wrapper = document.querySelector(".df-custom-select-wrapper");
        if (!wrapper) return;

        const realSelect = wrapper.querySelector("select");
        const selectedDiv = document.createElement("DIV");
        selectedDiv.className = "df-selected";
        selectedDiv.innerHTML = realSelect.options[realSelect.selectedIndex].innerHTML;
        wrapper.appendChild(selectedDiv);

        const itemsContainer = document.createElement("DIV");
        itemsContainer.className = "df-items df-hide";

        for (let i = 0; i < realSelect.length; i++) {
            const opt = realSelect.options[i];
            const item = document.createElement("DIV");
            item.innerHTML = opt.text.trim();

            if (opt.value === "parent") {
                item.className = "df-is-parent";
                item.setAttribute("data-nicho", opt.getAttribute("data-nicho"));
                item.innerHTML += ' <i class="fas fa-chevron-right" style="float:right; font-size:10px; margin-top:3px;"></i>';
            } else if (opt.value === "sub") {
                item.className = "df-is-sub";
                item.setAttribute("data-parent", opt.getAttribute("data-parent"));
            }

            item.addEventListener("click", function(e) {
                // Impede fechar ao clicar em categoria pai (acordeão)
                if (this.classList.contains("df-is-parent")) {
                    e.stopPropagation(); 
                    const target = this.getAttribute("data-nicho");
                    itemsContainer.querySelectorAll(".df-is-sub").forEach(sub => {
                        if (sub.getAttribute("data-parent") === target) {
                            sub.classList.toggle("df-show");
                        } else {
                            sub.classList.remove("df-show");
                        }
                    });
                } else {
                    // Seleção de item final: fecha o dropdown e busca
                    const termoEscolhido = this.innerText.trim();
                    selectedDiv.innerHTML = this.innerHTML;
                    
                    const inputBusca = document.getElementById('searchInput');
                    if (inputBusca) {
                        inputBusca.value = termoEscolhido;
                        fecharDropdown();
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
            e.stopPropagation(); // Evita que o clique no botão dispare o fechamento imediato do window
            itemsContainer.classList.toggle("df-hide");
            selectedDiv.classList.toggle("df-arrow-active");
        });

        // CORREÇÃO: Fecha ao clicar em qualquer lugar da tela
        window.addEventListener("click", (e) => {
            if (!wrapper.contains(e.target)) {
                fecharDropdown();
            }
        });
    });
})();
