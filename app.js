// ====== حالت اولیه ======
let state = JSON.parse(localStorage.getItem("trading_state")) || {
  balance: 1000,
  holdings: { bitcoin: 0, ethereum: 0, solana: 0 },
  history: [],
  theme: "dark"
};

let currentCoin = "bitcoin";
let price = 0;
let chart;

// ====== عناصر HTML ======
const balanceEl = document.getElementById("balance");
const priceEl = document.getElementById("price");
const assetEl = document.getElementById("asset");
const historyEl = document.getElementById("history");
const plEl = document.getElementById("pl");
const messageEl = document.getElementById("message");
const themeBtn = document.getElementById("themeToggle");

// ====== ذخیره در LocalStorage ======
function save() {
  localStorage.setItem("trading_state", JSON.stringify(state));
}

// ====== بروزرسانی UI ======
function updateUI() {
  balanceEl.innerText = state.balance.toFixed(2);
  assetEl.innerText = state.holdings[currentCoin].toFixed(6);
  const totalPL = state.balance + state.holdings[currentCoin]*price - 1000;
  plEl.innerText = `$${totalPL.toFixed(2)}`;
  renderHistory();
  save();
}

function renderHistory() {
  historyEl.innerHTML = "";
  state.history.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.innerText = h;
    historyEl.appendChild(li);
  });
}

// ====== قیمت واقعی از API ======
async function fetchPrice() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${currentCoin}&vs_currencies=usd`);
    const data = await res.json();
    price = data[currentCoin].usd;
    priceEl.innerText = price.toLocaleString();
  } catch {
    priceEl.innerText = "Error";
  }
}

// ====== نمودار زنده ======
async function fetchChart() {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${currentCoin}/market_chart?vs_currency=usd&days=1`);
    const data = await res.json();
    const labels = data.prices.map(p => new Date(p[0]).toLocaleTimeString());
    const values = data.prices.map(p => p[1]);

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("chart"), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: currentCoin.toUpperCase(),
          data: values,
          tension: 0.3,
          borderColor: "#3498db",
          backgroundColor: "rgba(52,152,219,0.2)"
        }]
      },
      options: { plugins: { legend: { display: false } } }
    });
  } catch(e){ console.log(e) }
}

// ====== خرید ======
document.getElementById("buyBtn").onclick = () => {
  const amount = Number(document.getElementById("amount").value);
  if (!amount || amount <=0) return messageEl.innerText="Enter valid amount";
  if (amount > state.balance) return messageEl.innerText="Not enough balance";

  const bought = amount / price;
  state.balance -= amount;
  state.holdings[currentCoin] += bought;
  state.history.push(`Bought ${bought.toFixed(6)} ${currentCoin} at $${price}`);
  updateUI();
};

// ====== فروش ======
document.getElementById("sellBtn").onclick = () => {
  const amount = Number(document.getElementById("amount").value);
  const sellAsset = amount / price;
  if (!amount || amount <=0) return messageEl.innerText="Enter valid amount";
  if (sellAsset > state.holdings[currentCoin]) return messageEl.innerText="Not enough asset";

  state.holdings[currentCoin] -= sellAsset;
  state.balance += amount;
  state.history.push(`Sold ${sellAsset.toFixed(6)} ${currentCoin} at $${price}`);
  updateUI();
};

// ====== تغییر ارز ======
document.getElementById("coin").onchange = (e) => {
  currentCoin = e.target.value;
  fetchPrice();
  fetchChart();
  updateUI();
};

// ====== دارک/لایت مود ======
themeBtn.onclick = () => {
  document.body.classList.toggle("light");
  state.theme = document.body.classList.contains("light") ? "light":"dark";
  save();
};

function initTheme() {
  if(state.theme==="light") document.body.classList.add("light");
}

// ====== شروع برنامه ======
initTheme();
updateUI();
fetchPrice();
fetchChart();
setInterval(fetchPrice, 10000);
