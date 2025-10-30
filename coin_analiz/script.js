// ====== GLOBAL ======
let favorites = [];
let currentUserEmail = "";
let showingFavorites = false;

// === CoinGecko API/Anahtar Kodları SİLİNDİ ===
// === Manuel Logo Map KALDI ===
const manualLogoMap = {
    "TURTLEUSDT": "https://assets.coingecko.com/coins/images/69595/standard/OUDzqTkE_400x400.png?1759166194",
     "C98USDT": "https://assets.coingecko.com/coins/images/17117/standard/logo.png?1696516677",
     "MASKUSDT": "https://assets.coingecko.com/coins/images/14051/standard/Mask_Network.jpg?1696513776"
    // Diğer manuel logolar buraya eklenebilir (sonuncuda virgül yok)
};

// ===========================================
// ====== FİYAT FORMATLAMA FONKSİYONU ======
// ===========================================
function formatPrice(price) {
    if (price == null || isNaN(price)) { return "-"; }
    if (price < 0.001 && price > 0) { return price.toFixed(8); }
    if (price < 1 && price > 0) { return price.toFixed(4); }
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// ===========================================


// ===========================================
// ====== LOGO FONKSİYONLARI (GitHub Repo Kullanacak Şekilde Düzeltildi) ======
// ===========================================
/**
 * Sembolü parçalayıp ana para birimini (küçük harf) bulan fonksiyon
 */
function getBaseSymbol(symbol) {
    let base = symbol;
    const quotes = ["USDT", "BUSD", "USDC", "TUSD", "FDUSD", "ETH", "BTC"];
    for (const quote of quotes) { if (base.endsWith(quote) && base.length > quote.length) { base = base.substring(0, base.length - quote.length); break; } }
    const prefixes = ["1000000", "100000", "1000", "100"];
    for (const prefix of prefixes) { if (base.startsWith(prefix)) { base = base.substring(prefix.length); break; } }
    if (symbol === "1000LUNCUSDT") return "lunc";
    if (symbol === "LUNA2USDT") return "luna"; // luna2 değil, luna olabilir repo'da
    if (symbol === "BTCDOMUSDT") return "btc";
    if (symbol === "1000PEPEUSDT") return "pepe";
    if (symbol === "1000FLOKIUSDT") return "floki";
    if (symbol === "1000XECUSDT") return "xec"; // ecash yerine xec olabilir repo'da
    if (symbol === "1000SHIBUSDT") return "shib";
    if (symbol === "1000SATSUSDT") return "sats"; // Bu repo'da olmayabilir
    if (symbol === "1000RATSUSDT") return "rats"; // Bu repo'da olmayabilir
    if (symbol === "1000BONKUSDT") return "bonk";
    return base.toLowerCase(); // GitHub repo'su küçük harf kullanır
}

/**
 * Ana para birimi sembolünü alıp logo URL'si döndüren fonksiyon (GitHub Repo)
 */
function getLogoUrl(symbol) {
    const baseSymbol = getBaseSymbol(symbol); // Küçük harf döner
    // Güvenilir GitHub reposu
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/${baseSymbol}.svg`;
}
// === CoinGecko API Fonksiyonları SİLİNDİ ===


// ====== COİN VERİLERİNİ YÜKLEME (GitHub Logoları + TradingView + Düzeltmeler) ======
document.addEventListener("DOMContentLoaded", () => {
    loadCoinData();
    setInterval(loadCoinData, 60 * 60 * 1000); // Otomatik yenileme aktif
});

async function loadCoinData() {
    const tbody = document.querySelector("#coinTable tbody");
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#aaa;">⏳ Analiz verileri yükleniyor...</td></tr>`; // Colspan=8

    try {
        // Sadece data.json'dan çek
        const url = `${window.location.origin}/data.json?cache=${Date.now()}`;
        console.log("📂 data.json yükleniyor:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`data.json bulunamadı! (${response.status})`);
        const analysisData = await response.json();
        console.log("✅ data.json yüklendi, coin sayısı:", analysisData.coins?.length || 0);

        tbody.innerHTML = ""; // Yükleniyor mesajını temizle
        if (!analysisData.coins || analysisData.coins.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#888;">Analiz verisi bulunamadı.</td></tr>`;
            return;
        }

        analysisData.coins.forEach((c) => {
            const row = document.createElement("tr");
            // TradingView URL'si
            const tradingViewSymbol = `BINANCE:${c.symbol}`;
            const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tradingViewSymbol)}`;

            const positionColor =
                c.position === "Long" ? "limegreen" : c.position === "Short" ? "red" : "gray";

            const isFav = favorites.includes(c.symbol);
            const star = isFav ? "⭐" : "☆";

            // --- Logo URL'sini al (Önce Manuel, sonra GitHub) ---
            let logoUrl = manualLogoMap[c.symbol];
            const baseSymbolLower = getBaseSymbol(c.symbol);
            if (!logoUrl) { // Manuelde yoksa GitHub URL'sini oluştur
                logoUrl = getLogoUrl(c.symbol); // getLogoUrl GitHub linkini döndürür
            }
            // onerror'de display='none' kullanalım, visibility sorun çıkarabilir
            const logoImgTag = `<img src="${logoUrl}" class="coin-logo" alt="${baseSymbolLower}" onerror="this.style.display='none'">`;
            // --- Logo Alma Sonu ---

            // --- HTML ---
            row.innerHTML = `
                <td class="fav-cell">${star}</td>
                <td>
                    <div class="coin-cell-content">
                        ${logoImgTag}
                        <span class="coin-symbol">${c.symbol}</span>
                    </div>
                </td>
                <td class="price-cell">${formatPrice(c.price)}</td>
                <td>${c.rsi ?? "-"}</td>
                <td>${c.price_change?.toFixed(2) ?? "-"}%</td>
                <td>${c.volume_change?.toFixed(2) ?? "-"}%</td>
                <td>${c.score?.toFixed(2) ?? "-"}</td>
                <td style="color:${positionColor}; font-weight:bold;">${c.position}</td>
            `;
            // --- HTML SONU ---

            tbody.appendChild(row);

            // --- Tıklama Eventleri ---
            // Favori
            const favCell = row.querySelector(".fav-cell");
            favCell.style.cursor = 'pointer';
            favCell.addEventListener("click", (event) => {
                event.stopPropagation();
                const currentSymbol = c.symbol;
                if (favorites.includes(currentSymbol)) {
                    removeFavorite(currentSymbol, favCell);
                } else {
                    toggleFavorite(currentSymbol, favCell);
                }
            });

            // Sembol -> TradingView
            const symbolSpan = row.querySelector(".coin-symbol");
            if (symbolSpan) {
                symbolSpan.style.cursor = 'pointer';
                symbolSpan.style.textDecoration = 'underline';
                symbolSpan.style.color = '#79c0ff';
                symbolSpan.addEventListener('click', (event) => {
                    event.stopPropagation();
                    window.open(tradingViewUrl, '_blank');
                });
            }
            // --- Tıklama Eventleri Sonu ---
        });

        // Son güncelleme zamanını göster
        let updateText = document.querySelector("#lastUpdate");
        const container = document.querySelector(".container"); // Container'ı bul

        if (!updateText && container) { // Hem updateText yoksa HEM DE container varsa oluştur
            updateText = document.createElement("p");
            updateText.id = "lastUpdate";
            updateText.style.textAlign = "center";
            updateText.style.color = "#00ffa2";
            updateText.style.marginTop = "10px";
            updateText.style.fontSize = "14px";
            container.appendChild(updateText); // Bulunan container'a ekle
        }

        // --- 💎 textContent Hatası Düzeltmesi 💎 ---
        // Sadece updateText elementi gerçekten varsa içeriğini ayarla
        if (updateText && analysisData.last_update) {
            updateText.textContent = `🕒 Analiz Zamanı: ${analysisData.last_update}`;
        } else if (updateText) {
            updateText.textContent = `🕒 Analiz Zamanı: Bilinmiyor`; // last_update yoksa
        }
        // --- Düzeltme Sonu ---

    } catch (error) {
        console.error("❌ Veri yüklenemedi:", error);
        tbody.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">Hata: ${error.message}</td></tr>`;
        // Artık API hatası mesajı yok
    }
}


// ====== FAVORİ YÖNETİMİ ======
function toggleFavorite(symbol, el) {
    if (currentUserEmail) {
        favorites.push(symbol);
        saveFavorites();
        el.textContent = "⭐";
        // Eğer favoriler gösteriliyorsa ve yeni eklenen favori, favori listesinde değilse göster
        if (showingFavorites) {
            // Favori modundayken, eklenen coin'i göster
            // Favori filtresi daha sonra 'input' event'inde yeniden çalışacak (searchInput.value boş bile olsa)
            // Bu yüzden sadece UI'ı güncellemek yeterli.
        }
    } else {
        alert("⚠️ Favori eklemek için lütfen önce giriş yapın!");
    }
}

function removeFavorite(symbol, el) {
    favorites = favorites.filter((fav) => fav !== symbol);
    saveFavorites();
    el.textContent = "☆";
    // Eğer favoriler gösteriliyorsa ve favori çıkarıldıysa o satırı gizle
    if (showingFavorites) {
        const row = el.closest("tr");
        if (row) {
             row.style.display = "none"; // Satırı hemen gizle
        }
    }
}

function saveFavorites() {
    if (currentUserEmail && favorites.length > 0) {
        localStorage.setItem(`favorites_${currentUserEmail}`, JSON.stringify(favorites));
    } else if (currentUserEmail) {
        localStorage.removeItem(`favorites_${currentUserEmail}`);
    }
}

function loadFavorites() {
    if (currentUserEmail) {
        const savedFavorites = localStorage.getItem(`favorites_${currentUserEmail}`);
        favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
        console.log(`⭐ Favoriler yüklendi (${favorites.length} adet).`);
    } else {
        favorites = [];
    }
}


// ====== 🔍 ARAMA ÖZELLİĞİ (DÜZELTİLDİ) ======
const searchInput = document.getElementById("coinSearch");
const searchInfo = document.getElementById("searchInfo");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toUpperCase().trim();
        const rows = document.querySelectorAll("#coinTable tbody tr");

        rows.forEach(row => {
            // Yükleniyor, Hata veya Güncelleme Zamanı gibi satırları atla
            const symbolElement = row.querySelector(".coin-symbol");
            if (!symbolElement) return;

            const coinSymbol = symbolElement.textContent.toUpperCase();
            
            // Eğer arama terimi boşsa VEYA coin sembolü arama terimini içeriyorsa (includes)
            const matchesSearch = coinSymbol.includes(searchTerm);
            
            // Satırın mevcut favori durumunu al
            const isFav = row.querySelector(".fav-cell").textContent.includes("⭐");

            // Favori modunda gösterilecek mi?
            let shouldShow = false;

            if (showingFavorites) {
                // Sadece favorileri gösteriyorsak: Favori OLMALI VE aramaya UYMALI
                if (isFav && matchesSearch) {
                    shouldShow = true;
                }
            } else {
                // Normal moddaysak: Sadece aramaya UYMALI
                if (matchesSearch) {
                    shouldShow = true;
                }
            }
            
            row.style.display = shouldShow ? "" : "none";
        });
    });
}


// ====== DROPDOWN FAVORİLER ======
const favBtn = document.getElementById("menu-favorites");
if (favBtn) {
    favBtn.addEventListener("click", () => {
        showingFavorites = !showingFavorites; // Durumu tersine çevir
        favBtn.textContent = showingFavorites ? "📊 Panel" : "⭐ Favoriler"; // Buton metnini değiştir

        const searchTerm = searchInput ? searchInput.value.toUpperCase().trim() : "";
        const rows = document.querySelectorAll("#coinTable tbody tr");
        const favRows = document.querySelectorAll("#coinTable tbody tr .fav-cell");
        let favoriteCount = 0;
        let visibleCount = 0;

        rows.forEach((row) => {
            const favCell = row.querySelector(".fav-cell");
            const symbolElement = row.querySelector(".coin-symbol");

            // Yükleniyor/Hata satırlarını atla
            if (!favCell || !symbolElement) return;

            const isFav = favCell.textContent.includes("⭐");
            const coinSymbol = symbolElement.textContent.toUpperCase();
            const matchesSearch = coinSymbol.includes(searchTerm);

            if (isFav) favoriteCount++;

            let shouldShow = false;

            if (showingFavorites) {
                // Favori modu: Favori OLMALI VE aramaya UYMALI
                if (isFav && matchesSearch) {
                    shouldShow = true;
                }
            } else {
                // Normal mod: Sadece aramaya UYMALI
                if (matchesSearch) {
                    shouldShow = true;
                }
            }

            row.style.display = shouldShow ? "" : "none";
            if (shouldShow) visibleCount++;
        });

        // Arama/Bilgi metnini güncelle
        if (searchInfo) {
            if (showingFavorites) {
                searchInfo.textContent = `Favori modunda: ${visibleCount} / ${favoriteCount} favori coin görüntüleniyor.`;
            } else {
                searchInfo.textContent = ""; // Normal modda bilgiyi gizle
            }
        }
    });
}


// ====== FIREBASE KULLANICI TAKİBİ (Zamanlama Düzeltmesi ile) ======
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserEmail = user.email;
        loadFavorites();
        // Zamanlama hatasını önlemek için setTimeout
        setTimeout(() => {
            updateFavoriteStarsUI();
        }, 500); // Yarım saniye bekle

    } else {
        favorites = [];
        currentUserEmail = "";
        showingFavorites = false;
        if (searchInput) searchInput.value = "";
        updateFavoriteStarsUI(); // Yıldızları hemen temizle
        const tbody = document.querySelector("#coinTable tbody");
        // Tablo boşsa veya sadece yükleniyor mesajı varsa loadCoinData'yı çağır
        if (!tbody || tbody.children.length <= 1 || tbody.textContent.includes("yükleniyor")) {
            loadCoinData();
        }
    }
});

// === FONKSİYON: Sadece favori yıldızlarını günceller ===
function updateFavoriteStarsUI() {
    const rows = document.querySelectorAll("#coinTable tbody tr");
    rows.forEach(row => {
        const symbolElement = row.querySelector(".coin-symbol");
        const favCellElement = row.querySelector(".fav-cell");
        if (symbolElement && favCellElement) {
            const currentSymbolText = symbolElement.textContent.trim();
            const isFav = favorites.includes(currentSymbolText);
            favCellElement.textContent = isFav ? "⭐" : "☆";
        }
    });
}

// ====== 🔄 MANUEL ANALİZ/YENİLEME BUTONU (YENİ EKLENDİ) ======
// HTML'de <button id="analyzeBtn">Verileri Analiz Et</button> gibi bir buton olmalıdır.
const analyzeButton = document.getElementById("analyzeBtn"); 

if (analyzeButton) {
    analyzeButton.addEventListener("click", () => {
        console.log("🔄 Manuel analiz tetiklendi...");
        // Butona tıklandığında verileri yeniden yükle
        loadCoinData(); 
    });
}

