class Wallet {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.init();
    }

    async init() {
        console.log('💰 Инициализация кошелька...');
        this.tg.expand();
        await this.loadUserData();
        this.setupEventListeners();
        this.render();
        console.log('✅ Кошелёк готов!');
    }

    async loadUserData() {
        const tgUser = this.tg.initDataUnsafe?.user;
        const userId = tgUser?.id || 'test';
        const savedData = localStorage.getItem(`user_${userId}`);
        this.userData = savedData ? JSON.parse(savedData) : {
            currencies: { grain: 0, gromd: 0, ton: 0, stars: 0 },
            pets: [],
            accessories: []
        };
    }

    setupEventListeners() {
        document.getElementById('back-btn').addEventListener('click', () => {
            window.close();
        });

        // Обмен валют
        document.querySelectorAll('.exchange-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const from = e.target.dataset.from;
                const to = e.target.dataset.to;
                const rate = parseFloat(e.target.dataset.rate);
                this.exchangeCurrency(from, to, rate);
            });
        });

        // Обновление сумм при изменении input
        document.getElementById('stars-to-grain').addEventListener('input', (e) => {
            const stars = parseInt(e.target.value) || 0;
            const grains = stars * CONFIG.CURRENCY_RATES.STAR_TO_GRAIN;
            e.target.parentElement.querySelector('.exchange-btn').textContent = 
                `Обменять → ${grains} 🌾`;
        });

        document.getElementById('ton-to-grain').addEventListener('input', (e) => {
            const ton = parseFloat(e.target.value) || 0;
            const grains = Math.floor(ton * CONFIG.CURRENCY_RATES.TON_TO_GRAIN);
            e.target.parentElement.querySelector('.exchange-btn').textContent = 
                `Обменять → ${grains} 🌾`;
        });

        document.getElementById('ton-to-stars').addEventListener('input', (e) => {
            const ton = parseFloat(e.target.value) || 0;
            const stars = Math.floor(ton * CONFIG.CURRENCY_RATES.TON_TO_STAR);
            e.target.parentElement.querySelector('.exchange-btn').textContent = 
                `Обменять → ${stars} ⭐`;
        });
    }

    render() {
        this.updateBalances();
        this.updateStats();
    }

    updateBalances() {
        // Основная валюта
        document.getElementById('gromd-main').textContent = 
            this.userData.currencies.gromd.toFixed(2);
        
        // Остальные валюты
        document.getElementById('grain-wallet').textContent = 
            Math.floor(this.userData.currencies.grain);
        document.getElementById('ton-wallet').textContent = 
            this.userData.currencies.ton.toFixed(1);
        document.getElementById('stars-wallet').textContent = 
            Math.floor(this.userData.currencies.stars);
    }

    updateStats() {
        // Статистика
        document.getElementById('total-pets').textContent = 
            this.userData.pets?.length || 0;
        document.getElementById('total-accessories').textContent = 
            this.userData.accessories?.length || 0;
        
        // Общий GROMD (на питомцах + в кошельке)
        const petsGromd = this.userData.pets?.reduce((sum, pet) => 
            sum + (pet.gromdCollected || 0), 0) || 0;
        const totalGromd = petsGromd + (this.userData.currencies.gromd || 0);
        document.getElementById('total-gromd').textContent = totalGromd.toFixed(2);
        
        // Время в игре
        const playTime = this.userData.createdAt ? 
            Math.floor((Date.now() - this.userData.createdAt) / (1000 * 60 * 60 * 24)) : 0;
        document.getElementById('play-time').textContent = 
            playTime > 0 ? `${playTime}д` : '1д';
    }

    exchangeCurrency(from, to, rate) {
        const inputId = `${from}-to-${to}`;
        const amountInput = document.getElementById(inputId);
        const amount = parseFloat(amountInput.value) || 0;

        if (amount <= 0) {
            this.showMessage('❌ Введите корректную сумму!');
            return;
        }

        if (this.userData.currencies[from] < amount) {
            this.showMessage(`❌ Недостаточно ${this.getCurrencyName(from)}!`);
            return;
        }

        const received = Math.floor(amount * rate);

        // Списание
        this.userData.currencies[from] -= amount;
        // Зачисление
        this.userData.currencies[to] += received;

        this.saveUserData();
        this.render();

        this.showMessage(
            `✅ Успешный обмен!\n` +
            `📤 Отдано: ${amount} ${this.getCurrencyIcon(from)}\n` +
            `📥 Получено: ${received} ${this.getCurrencyIcon(to)}`
        );
    }

    getCurrencyName(currency) {
        const names = {
            grain: 'зёрен',
            gromd: 'GROMD',
            ton: 'TON',
            stars: 'звёзд'
        };
        return names[currency] || currency;
    }

    getCurrencyIcon(currency) {
        const icons = {
            grain: '🌾',
            gromd: '⚡',
            ton: '💎',
            stars: '⭐'
        };
        return icons[currency] || '';
    }

    saveUserData() {
        const tgUser = this.tg.initDataUnsafe?.user;
        const userId = tgUser?.id || 'test';
        localStorage.setItem(`user_${userId}`, JSON.stringify(this.userData));
    }

    showMessage(text) {
        this.tg.showPopup({
            title: '💰 Кошелёк',
            message: text,
            buttons: [{ type: 'ok' }]
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Wallet();
});