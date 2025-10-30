class Market {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.gameData = null;
        this.marketData = null;
        this.currentTab = 'pets';
        this.selectedItem = null;
        this.charts = {};
        
        this.init();
    }

    async init() {
        console.log('🏪 Инициализация рынка...');
        this.tg.expand();
        await this.loadData();
        this.setupEventListeners();
        this.render();
        this.loadMarketData();
        console.log('✅ Рынок готов!');
    }

    async loadData() {
        const tgUser = this.tg.initDataUnsafe?.user;
        const userId = tgUser?.id || 'test';
        const savedData = localStorage.getItem(`user_${userId}`);
        this.userData = savedData ? JSON.parse(savedData) : { pets: [], accessories: [] };

        try {
            const [petsResponse, accessoriesResponse, marketResponse] = await Promise.all([
                fetch('data/pets.json'),
                fetch('data/accessories.json'),
                fetch('data/market.json')
            ]);
            
            this.gameData = {
                pets: await petsResponse.json(),
                accessories: await accessoriesResponse.json()
            };
            
            this.marketData = await marketResponse.json();
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.gameData = { pets: [], accessories: [] };
            this.marketData = { pets: [], accessories: [] };
        }
    }

    async loadMarketData() {
        if (!this.marketData.pets || this.marketData.pets.length === 0) {
            this.generateMockMarketData();
        }
        this.render();
    }

    generateMockMarketData() {
        this.marketData = {
            pets: [
                {
                    id: 1,
                    itemId: 1,
                    type: 'pet',
                    sellerId: 'user123',
                    price: { grain: 500, stars: 25 },
                    startPrice: { grain: 500, stars: 25 },
                    history: [
                        { timestamp: Date.now() - 86400000, price: 450 },
                        { timestamp: Date.now() - 43200000, price: 480 },
                        { timestamp: Date.now(), price: 500 }
                    ],
                    listedAt: Date.now() - 86400000,
                    quantity: 1
                }
            ],
            accessories: [
                {
                    id: 2,
                    itemId: 1,
                    type: 'accessory',
                    sellerId: 'user456',
                    price: { grain: 200, stars: 10 },
                    startPrice: { grain: 200, stars: 10 },
                    history: [
                        { timestamp: Date.now() - 86400000, price: 180 },
                        { timestamp: Date.now() - 43200000, price: 190 },
                        { timestamp: Date.now(), price: 200 }
                    ],
                    listedAt: Date.now() - 86400000,
                    quantity: 1
                }
            ]
        };
    }

    setupEventListeners() {
        document.getElementById('back-btn').addEventListener('click', () => window.close());

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.getElementById('rarity-filter').addEventListener('change', () => this.render());
        document.getElementById('price-filter').addEventListener('change', () => this.render());

        document.getElementById('close-buy-modal').addEventListener('click', () => this.closeBuyModal());
        document.getElementById('close-sell-modal').addEventListener('click', () => this.closeSellModal());

        document.getElementById('buy-grain-btn').addEventListener('click', () => this.buyItem('grain'));
        document.getElementById('buy-stars-btn').addEventListener('click', () => this.buyItem('stars'));

        document.getElementById('sell-pet-btn').addEventListener('click', () => this.showSellModal('pet'));
        document.getElementById('sell-accessory-btn').addEventListener('click', () => this.showSellModal('accessory'));
        document.getElementById('confirm-sell').addEventListener('click', () => this.confirmSell());
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');

        this.render();
    }

    render() {
        switch(this.currentTab) {
            case 'pets':
                this.renderPetsMarket();
                break;
            case 'accessories':
                this.renderAccessoriesMarket();
                break;
            case 'my-sales':
                this.renderMySales();
                break;
        }
    }

    renderPetsMarket() {
        const container = document.getElementById('pets-market');
        container.innerHTML = '';

        const rarityFilter = document.getElementById('rarity-filter').value;
        const priceFilter = document.getElementById('price-filter').value;

        let petsToShow = this.marketData.pets || [];

        if (rarityFilter !== 'all') {
            petsToShow = petsToShow.filter(item => {
                const pet = this.getPetById(item.itemId);
                return pet && pet.rarity === rarityFilter;
            });
        }

        if (priceFilter !== 'all') {
            petsToShow = this.filterByPrice(petsToShow, priceFilter);
        }

        if (petsToShow.length === 0) {
            container.innerHTML = '<div class="empty-state">🐾 Нет питомцев на продажу</div>';
            return;
        }

        petsToShow.forEach(marketItem => {
            const pet = this.getPetById(marketItem.itemId);
            if (!pet) return;

            const itemElement = document.createElement('div');
            itemElement.className = `market-item ${pet.rarity}`;
            itemElement.innerHTML = `
                <div class="market-item-header">
                    <div class="market-item-name">${pet.name}</div>
                    <div class="market-item-rarity">${this.getRarityName(pet.rarity)}</div>
                </div>
                <div class="market-item-content">
                    <img class="market-item-image" src="${pet.image}" alt="${pet.name}" onerror="this.style.display='none'">
                    <div class="market-item-details">
                        <div class="market-item-stats">
                            Ур. ${marketItem.level || 1} • 🌾 Фарм: ${pet.farm_rate}/5мин
                        </div>
                        <div class="market-item-price">
                            ${marketItem.price.grain} 🌾 • ${marketItem.price.stars} ⭐
                        </div>
                        <div class="market-item-seller">
                            👤 Продавец: #${marketItem.sellerId.slice(-6)}
                        </div>
                    </div>
                </div>
            `;

            itemElement.addEventListener('click', () => {
                this.showBuyModal(marketItem, pet, 'pet');
            });

            container.appendChild(itemElement);
        });
    }

    renderAccessoriesMarket() {
        const container = document.getElementById('accessories-market');
        container.innerHTML = '';

        const rarityFilter = document.getElementById('rarity-filter').value;
        const priceFilter = document.getElementById('price-filter').value;

        let accessoriesToShow = this.marketData.accessories || [];

        if (rarityFilter !== 'all') {
            accessoriesToShow = accessoriesToShow.filter(item => {
                const accessory = this.getAccessoryById(item.itemId);
                return accessory && accessory.rarity === rarityFilter;
            });
        }

        if (priceFilter !== 'all') {
            accessoriesToShow = this.filterByPrice(accessoriesToShow, priceFilter);
        }

        if (accessoriesToShow.length === 0) {
            container.innerHTML = '<div class="empty-state">👕 Нет аксессуаров на продажу</div>';
            return;
        }

        accessoriesToShow.forEach(marketItem => {
            const accessory = this.getAccessoryById(marketItem.itemId);
            if (!accessory) return;

            const itemElement = document.createElement('div');
            itemElement.className = `market-item ${accessory.rarity}`;
            itemElement.innerHTML = `
                <div class="market-item-header">
                    <div class="market-item-name">${accessory.name}</div>
                    <div class="market-item-rarity">${this.getRarityName(accessory.rarity)}</div>
                </div>
                <div class="market-item-content">
                    <img class="market-item-image" src="${accessory.image}" alt="${accessory.name}" onerror="this.style.display='none'">
                    <div class="market-item-details">
                        <div class="market-item-stats">
                            ${this.getAccessoryTypeName(accessory.type)} • +${accessory.farm_bonus} 🌾
                        </div>
                        <div class="market-item-price">
                            ${marketItem.price.grain} 🌾 • ${marketItem.price.stars} ⭐
                        </div>
                        <div class="market-item-seller">
                            👤 Продавец: #${marketItem.sellerId.slice(-6)}
                        </div>
                    </div>
                </div>
            `;

            itemElement.addEventListener('click', () => {
                this.showBuyModal(marketItem, accessory, 'accessory');
            });

            container.appendChild(itemElement);
        });
    }

    renderMySales() {
        const container = document.getElementById('my-sales-list');
        container.innerHTML = '';

        const mySales = [...(this.marketData.pets || []), ...(this.marketData.accessories || [])]
            .filter(item => item.sellerId === this.getUserId());

        if (mySales.length === 0) {
            container.innerHTML = '<div class="empty-state">💼 Нет активных продаж</div>';
            return;
        }

        mySales.forEach(sale => {
            const item = sale.type === 'pet' 
                ? this.getPetById(sale.itemId)
                : this.getAccessoryById(sale.itemId);

            if (!item) return;

            const saleElement = document.createElement('div');
            saleElement.className = `sale-item ${sale.status || 'active'}`;
            saleElement.innerHTML = `
                <div class="sale-header">
                    <div class="sale-name">${item.name}</div>
                    <div class="sale-price">${sale.price.grain} 🌾</div>
                </div>
                <div class="sale-details">
                    <div class="sale-type">${sale.type === 'pet' ? '🐾 Питомец' : '👕 Аксессуар'}</div>
                    <div class="sale-status ${sale.status || 'active'}">
                        ${this.getSaleStatus(sale.status)}
                    </div>
                    <div class="sale-listed">
                        📅 Выставлен: ${new Date(sale.listedAt).toLocaleDateString()}
                    </div>
                </div>
            `;

            container.appendChild(saleElement);
        });
    }

    showBuyModal(marketItem, item, type) {
        this.selectedItem = { marketItem, item, type };
        
        document.getElementById('buy-title').textContent = `🛒 Покупка ${item.name}`;
        
        const infoHtml = type === 'pet' 
            ? this.getPetInfoHtml(item)
            : this.getAccessoryInfoHtml(item);
        
        document.getElementById('buy-item-info').innerHTML = infoHtml;
        
        document.getElementById('grain-price').textContent = marketItem.price.grain;
        document.getElementById('stars-price').textContent = marketItem.price.stars;
        
        this.renderPriceChart(marketItem);
        
        document.getElementById('buy-modal').classList.add('active');
    }

    renderPriceChart(marketItem) {
        const ctx = document.getElementById('price-chart').getContext('2d');
        
        if (this.charts.priceChart) {
            this.charts.priceChart.destroy();
        }

        const prices = marketItem.history.map(h => h.price);
        const labels = marketItem.history.map((h, i) => {
            const date = new Date(h.timestamp);
            return i === marketItem.history.length - 1 ? 'Сейчас' : date.toLocaleDateString();
        });

        this.charts.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Цена (зёрна)',
                    data: prices,
                    borderColor: '#00ff00',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    }
                }
            }
        });
    }

    buyItem(currency) {
        if (!this.selectedItem) return;

        const { marketItem, item, type } = this.selectedItem;
        const price = marketItem.price[currency];

        if (this.userData.currencies[currency] < price) {
            this.showMessage(`❌ Недостаточно ${this.getCurrencyName(currency)}!`);
            return;
        }

        this.userData.currencies[currency] -= price;

        if (type === 'pet') {
            this.userData.pets.push({
                ...item,
                level: 1,
                satiety: 0,
                accessories: [0, 0, 0, 0],
                gromdCollected: 0,
                grainCollected: 0
            });
        } else {
            this.userData.accessories.push({
                id: item.id,
                acquired: Date.now()
            });
        }

        const marketArray = type === 'pet' ? this.marketData.pets : this.marketData.accessories;
        const index = marketArray.findIndex(i => i.id === marketItem.id);
        if (index > -1) {
            marketArray.splice(index, 1);
        }

        this.saveUserData();
        this.saveMarketData();
        this.closeBuyModal();
        this.render();
        
        this.showMessage(`✅ Вы успешно купили ${item.name}!`);
    }

    showSellModal(type) {
        this.selectedSellType = type;
        const selection = document.getElementById('sell-selection');
        selection.innerHTML = '';

        const items = type === 'pet' ? this.userData.pets : this.userData.accessories;
        
        if (!items || items.length === 0) {
            selection.innerHTML = `<div class="empty-state">❌ У вас нет ${type === 'pet' ? 'питомцев' : 'аксессуаров'} для продажи</div>`;
            return;
        }

        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'pet-select-item';
            
            if (type === 'pet') {
                itemElement.innerHTML = `
                    <strong>${item.name}</strong> (Ур. ${item.level})<br>
                    <small>${this.getRarityName(item.rarity)} • ⚡ GROMD: ${item.gromdCollected.toFixed(2)}</small>
                `;
            } else {
                const accessory = this.getAccessoryById(item.id);
                itemElement.innerHTML = `
                    <strong>${accessory.name}</strong><br>
                    <small>${this.getRarityName(accessory.rarity)} • +${accessory.farm_bonus} 🌾</small>
                `;
            }

            itemElement.addEventListener('click', () => {
                document.querySelectorAll('.pet-select-item').forEach(el => {
                    el.classList.remove('selected');
                });
                itemElement.classList.add('selected');
                this.selectedSellItem = item;
            });

            selection.appendChild(itemElement);
        });

        document.getElementById('sell-title').textContent = `💰 Продажа ${type === 'pet' ? 'питомца' : 'аксессуара'}`;
        document.getElementById('sell-modal').classList.add('active');
    }

    confirmSell() {
        if (!this.selectedSellItem || !this.selectedSellType) {
            this.showMessage('❌ Выберите предмет для продажи!');
            return;
        }

        const price = parseInt(document.getElementById('start-price').value);
        const currency = document.getElementById('sell-currency').value;

        if (!price || price < 1) {
            this.showMessage('❌ Введите корректную цену!');
            return;
        }

        const marketItem = {
            id: Date.now(),
            itemId: this.selectedSellType === 'pet' ? this.selectedSellItem.id : this.selectedSellItem.id,
            type: this.selectedSellType,
            sellerId: this.getUserId(),
            price: { 
                grain: currency === 'grain' ? price : Math.round(price * 20), 
                stars: currency === 'stars' ? price : Math.round(price / 20) 
            },
            startPrice: { 
                grain: currency === 'grain' ? price : Math.round(price * 20), 
                stars: currency === 'stars' ? price : Math.round(price / 20) 
            },
            history: [
                { timestamp: Date.now(), price: currency === 'grain' ? price : Math.round(price * 20) }
            ],
            listedAt: Date.now(),
            quantity: 1
        };

        const marketArray = this.selectedSellType === 'pet' ? this.marketData.pets : this.marketData.accessories;
        marketArray.push(marketItem);

        const userArray = this.selectedSellType === 'pet' ? this.userData.pets : this.userData.accessories;
        const index = userArray.findIndex(item => 
            this.selectedSellType === 'pet' ? item.id === this.selectedSellItem.id : item.id === this.selectedSellItem.id
        );
        if (index > -1) {
            userArray.splice(index, 1);
        }

        this.saveUserData();
        this.saveMarketData();
        this.closeSellModal();
        this.render();

        this.showMessage('✅ Предмет выставлен на рынок!');
    }

    getPetById(id) {
        return this.gameData.pets.find(pet => pet.id === id);
    }

    getAccessoryById(id) {
        return this.gameData.accessories.find(acc => acc.id === id);
    }

    getUserId() {
        const tgUser = this.tg.initDataUnsafe?.user;
        return tgUser?.id?.toString() || 'test';
    }

    getRarityName(rarity) {
        const names = {
            common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий',
            epic: 'Эпический', legendary: 'Легендарный'
        };
        return names[rarity] || rarity;
    }

    getAccessoryTypeName(type) {
        const names = {
            hat: 'Головной убор', clothes: 'Одежда', 
            pants: 'Штаны', hand: 'В руках'
        };
        return names[type] || type;
    }

    getCurrencyName(currency) {
        const names = { grain: 'зёрен', stars: 'звёзд', gromd: 'GROMD', ton: 'TON' };
        return names[currency] || currency;
    }

    getSaleStatus(status) {
        const statuses = { active: '🟢 Активно', sold: '💰 Продано', expired: '❌ Истекло' };
        return statuses[status] || '🟢 Активно';
    }

    filterByPrice(items, filter) {
        const prices = items.map(item => item.price.grain);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        return items.filter(item => {
            const price = item.price.grain;
            switch(filter) {
                case 'cheap': return price < avgPrice * 0.5;
                case 'medium': return price >= avgPrice * 0.5 && price <= avgPrice * 1.5;
                case 'expensive': return price > avgPrice * 1.5;
                default: return true;
            }
        });
    }

    getPetInfoHtml(pet) {
        return `
            <img src="${pet.image}" alt="${pet.name}" style="width: 100px; height: 100px; object-fit: contain; margin: 0 auto 10px; display: block;" onerror="this.style.display='none'">
            <div><strong>${pet.name}</strong></div>
            <div>🎯 Редкость: ${this.getRarityName(pet.rarity)}</div>
            <div>🌾 Фарм: ${pet.farm_rate}/5мин</div>
            <div>📈 Уровень: 1</div>
        `;
    }

    getAccessoryInfoHtml(accessory) {
        return `
            <img src="${accessory.image}" alt="${accessory.name}" style="width: 100px; height: 100px; object-fit: contain; margin: 0 auto 10px; display: block;" onerror="this.style.display='none'">
            <div><strong>${accessory.name}</strong></div>
            <div>📦 Тип: ${this.getAccessoryTypeName(accessory.type)}</div>
            <div>🎯 Редкость: ${this.getRarityName(accessory.rarity)}</div>
            <div>⚡ Бонус: +${accessory.farm_bonus} 🌾</div>
        `;
    }

    closeBuyModal() {
        document.getElementById('buy-modal').classList.remove('active');
        this.selectedItem = null;
    }

    closeSellModal() {
        document.getElementById('sell-modal').classList.remove('active');
        this.selectedSellItem = null;
        this.selectedSellType = null;
    }

    saveUserData() {
        const userId = this.getUserId();
        localStorage.setItem(`user_${userId}`, JSON.stringify(this.userData));
    }

    saveMarketData() {
        localStorage.setItem('market_data', JSON.stringify(this.marketData));
    }

    showMessage(text) {
        this.tg.showPopup({
            title: '🏪 Рынок',
            message: text,
            buttons: [{ type: 'ok' }]
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Market();
});