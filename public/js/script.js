const chatBox = document.querySelector(".chat-box");
const input = document.querySelector("#msg");
const btn = document.querySelector("#send");

let history = [];
let charts = [];

btn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => e.key === "Enter" && sendMessage());

function addMessage(text, role) {
    const div = document.createElement("div");
    div.className = `message ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    history.push({ role: "user", content: text });
    input.value = "";

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history })
        });

        const data = await res.json();

        if (!data.finished) {
            addMessage(data.reply, "bot");
            history.push({ role: "assistant", content: data.reply });
        } else {
            renderResults(data.data);
        }
    } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
        addMessage("Desculpe, ocorreu um erro. Tente novamente.", "bot");
    }
}

function renderResults(json) {
    document.querySelector(".result-container").style.display = "block";
    document.querySelector("#resume").textContent = json.resumo;
    document.querySelector("#objetivo").textContent = json.objetivo;

    const planoList = document.querySelector("#plano");
    planoList.innerHTML = "";
    json.plano.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p;
        planoList.appendChild(li);
    });

    // Limpar gráficos antigos
    if (charts.length > 0) {
        charts.forEach(c => c.destroy());
    }
    charts = [];

    // GRÁFICO 1 - PIZZA
    const ctx1 = document.getElementById("graf-economia");
    const economia = json.economia || 0;
    const outros = Math.max((json.renda || 0) - economia, 0);

    if (ctx1) {
        charts.push(new Chart(ctx1, {
            type: "pie",
            data: {
                labels: [`Economia (R$ ${economia})`, `Outros (R$ ${outros})`],
                datasets: [{
                    data: [economia, outros],
                    backgroundColor: ["#4a6cf7", "#d0d7ff"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: "bottom",
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        }));
    }

    // GRÁFICO 2 - BARRAS
    const ctx2 = document.getElementById("graf-barras");
    if (ctx2) {
        charts.push(new Chart(ctx2, {
            type: "bar",
            data: {
                labels: ["Renda", "Gastos", "Dívidas", "Economia"],
                datasets: [{
                    label: "Valores em R$",
                    data: [json.renda, json.gastos, json.dividas, json.economia],
                    backgroundColor: ["#4a6cf7", "#ff5959", "#ff9f43", "#4bd37b"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true 
                    } 
                }
            }
        }));
    }
}

// Mensagem inicial
if (chatBox.children.length === 0) {
    addMessage("Olá! Eu sou o Salomão AI, seu assistente financeiro. Vamos começar?", "bot");
    history.push({ role: "assistant", content: "Olá! Eu sou o Salomão AI, seu assistente financeiro. Vamos começar?" });
}