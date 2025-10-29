class PetGame {
    constructor() {
        this.user = null;
        this.currentPetIndex = 0;
        this.currentPet = null;
        this.inventory = {
            pets: [],
            accessories: []
        };
        this.market = {
            pets: [],
            accessories: []
        };
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация игры...');
        
        // Telegram Web App
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
        }

        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        this.startBackgroundProcesses();
        
        console.log('✅ Игра успешно запущена!');
    }

    async loadUserData() {
        const savedData = localStorage.getItem('petGameData');
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.user = data.user;
                this.inventory = data.inventory;
                this.currentPetIndex = data.currentPetIndex || 0;
                this.currentPet = this.inventory.pets[this.currentPetIndex];
                this.market = data.market || { pets: [], accessories: [] };
            } catch (e) {
                console.error('Ошибка загрузки данных:', e);
                this.createNewUser();
            }
        } else {
            this.createNewUser();
        }
    }

    createNewUser() {
        const tgUser = this.tg?.initDataUnsafe?.user;
        
        this.user = {
            id: tgUser?.id || Math.floor(Math.random() * 1000000),
            firstName: tgUser?.first_name || 'Player',
            photoUrl: tgUser?.photo_url || 'https://via.placeholder.com/40',
            currencies: {
                grains: 1000,
                gromd: 0,
                ton: 0,
                stars: 100
            },
            isAdmin: CONFIG.ADMIN_IDS.includes(String(tgUser?.id)) || true
        };

        // Стартовый питомец
        const starterPet = {
            id: this.generatePetId([1, 0, 0, 0, 0]),
            petId: 1,
            accessories: [0, 0, 0, 0, 0],
            level: 1,
            satiety: 50,
            grainsEarned: 0,
            gromdEarned: 0,
            lastFed: Date.now(),
            isBreeding: false,
            breedStartTime: null,
            marketId: null
        };

        this.inventory.pets = [starterPet];
        this.currentPetIndex = 0;
        this.currentPet = starterPet;
        
        this.saveGame();
    }

    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.id.replace('-btn', '-screen');
                this.showScreen(screen);
            });
        });

        // Стрелочки питомцев
        document.getElementById('prev-pet').addEventListener('click', () => this.previousPet());
        document.getElementById('next-pet').addEventListener('click', () => this.nextPet());

        // Действия
        document.getElementById('feed-btn').addEventListener('click', () => this.feedPet());
        document.getElementById('breed-btn').addEventListener('click', () => this.startBreeding());

        // Вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.showTab(tab);
            });
        });

        // Кошелек
        document.getElementById('exchange-btn').addEventListener('click', () => this.showExchangeModal());
        document.getElementById('withdraw-btn').addEventListener('click', () => this.showWithdrawModal());

        // Админ
        document.getElementById('admin-toggle').addEventListener('click', () => this.toggleAdminPanel());
        document.getElementById('close-admin').addEventListener('click', () => this.toggleAdminPanel());
        document.getElementById('add-currency-btn').addEventListener('click', () => this.addCurrency());
        document.getElementById('fast-grow-btn').addEventListener('click', () => this.fastGrowPet());
        document.getElementById('add-pet-btn').addEventListener('click', () => this.addRandomPet());
        document.getElementById('reset-game-btn').addEventListener('click', () => this.resetGame());

        // Баланс
        document.querySelector('.balance-add').addEventListener('click', () => this.addCurrency());
    }

    // Основные методы
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenName).classList.add('active');

        if (screenName === 'inventory-screen') {
            this.loadInventoryData();
        } else if (screenName === 'market-screen') {
            this.loadMarketData();
        }
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    previousPet() {
        if (this.inventory.pets.length <= 1) return;
        this.currentPetIndex = (this.currentPetIndex - 1 + this.inventory.pets.length) % this.inventory.pets.length;
        this.currentPet = this.inventory.pets[this.currentPetIndex];
        this.updateUI();
        this.createSwitchEffect('left');
    }

    nextPet() {
        if (this.inventory.pets.length <= 1) return;
        this.currentPetIndex = (this.currentPetIndex + 1) % this.inventory.pets.length;
        this.currentPet = this.inventory.pets[this.currentPetIndex];
        this.updateUI();
        this.createSwitchEffect('right');
    }

    updateUI() {
        if (!this.user || !this.currentPet) return;

        // Пользователь
        document.getElementById('user-photo').src = this.user.photoUrl;
        document.getElementById('user-name').textContent = this.user.firstName;
        document.getElementById('user-id').textContent = this.user.id;

        // Валюты
        document.getElementById('grains-amount').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('gromd-amount').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('wallet-grains').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('wallet-gromd').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('wallet-ton').textContent = this.formatNumber(this.user.currencies.ton);
        document.getElementById('wallet-stars').textContent = this.formatNumber(this.user.currencies.stars);

        // Питомец
        this.updatePetUI();

        // Админ
        document.getElementById('admin-toggle').style.display = this.user.isAdmin ? 'block' : 'none';
    }

    updatePetUI() {
        const petData = PETS_DATA[this.currentPet.petId];
        if (!petData) return;

        const rarity = RARITIES[petData.rarity];

        // Основная информация
        document.getElementById('pet-image').src = petData.image;
        document.getElementById('pet-image').className = `pet-image rarity-${petData.rarity}`;
        document.getElementById('pet-name').textContent = petData.name;
        document.getElementById('pet-level').textContent = this.currentPet.level;
        document.getElementById('pet-rarity').textContent = rarity.name.toUpperCase();
        document.getElementById('pet-rarity').className = `pet-rarity rarity-${petData.rarity}`;

        // Сытость
        document.getElementById('satiety-fill').style.width = `${this.currentPet.satiety}%`;
        document.getElementById('satiety-text').textContent = `${this.currentPet.satiety}/100`;

        // Статистика
        document.getElementById('farm-rate').textContent = `${petData.farmRate}/5min`;
        document.getElementById('grains-earned').textContent = this.currentPet.grainsEarned;

        // Стоимость кормления
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));
        document.getElementById('feed-cost').textContent = `${feedCost} зёрен`;

        // Кнопки
        this.updateButtons();

        // Счетчик питомцев
        document.getElementById('current-pet-num').textContent = this.currentPetIndex + 1;
        document.getElementById('total-pets').textContent = this.inventory.pets.length;
    }

    updateButtons() {
        const feedBtn = document.getElementById('feed-btn');
        const breedBtn = document.getElementById('breed-btn');

        // Кормление
        if (this.currentPet.satiety >= 100) {
            feedBtn.classList.add('disabled');
            feedBtn.disabled = true;
        } else {
            feedBtn.classList.remove('disabled');
            feedBtn.disabled = false;
        }

        // Размножение
        const canBreed = this.currentPet.level >= CONFIG.MIN_BREED_LEVEL && 
                        !this.currentPet.isBreeding && 
                        this.currentPet.satiety >= 100;

        if (canBreed) {
            breedBtn.classList.remove('disabled');
            breedBtn.disabled = false;
            breedBtn.querySelector('.btn-desc').textContent = '(готов)';
        } else {
            breedBtn.classList.add('disabled');
            breedBtn.disabled = true;
            
            if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
                breedBtn.querySelector('.btn-desc').textContent = `(Lv.${CONFIG.MIN_BREED_LEVEL}+)`;
            } else if (this.currentPet.isBreeding) {
                breedBtn.querySelector('.btn-desc').textContent = '(в процессе)';
            } else {
                breedBtn.querySelector('.btn-desc').textContent = '(сытость 100%)';
            }
        }
    }

    async feedPet() {
        if (!this.currentPet) {
            this.showNotification('❌ Нет активного питомца', 'error');
            return;
        }

        if (this.currentPet.satiety >= 100) {
            this.showNotification('🎯 Питомец уже сыт!', 'info');
            return;
        }

        const petData = PETS_DATA[this.currentPet.petId];
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));

        if (this.user.currencies.grains < feedCost) {
            this.showNotification('💸 Недостаточно зёрен!', 'error');
            return;
        }

        // Списание и начисление
        this.user.currencies.grains -= feedCost;
        this.currentPet.satiety = Math.min(100, this.currentPet.satiety + petData.satietyPerFeed);
        this.currentPet.lastFed = Date.now();
        this.currentPet.gromdEarned += petData.gromdPerFeed;

        // Уровень
        const leveledUp = this.checkLevelUp();

        this.saveGame();
        this.updateUI();
        
        // Эффекты
        this.createFeedEffect();
        this.showNotification(`🍗 +${petData.satietyPerFeed}% сытости`, 'success');

        if (leveledUp) {
            this.createLevelUpEffect();
        }
    }

    checkLevelUp() {
        if (this.currentPet.level < CONFIG.MAX_PET_LEVEL) {
            const neededExp = this.currentPet.level * 10;
            if (this.currentPet.gromdEarned >= neededExp) {
                this.currentPet.level++;
                this.showNotification(`🎉 Уровень ${this.currentPet.level}!`, 'success');
                return true;
            }
        }
        return false;
    }

    async startBreeding() {
        if (!this.currentPet) {
            this.showNotification('❌ Нет активного питомца', 'error');
            return;
        }

        if (this.currentPet.isBreeding) {
            this.showNotification('⏳ Уже размножается!', 'info');
            return;
        }

        if (this.currentPet.satiety < 100) {
            this.showNotification('🍗 Нужна полная сытость!', 'warning');
            return;
        }

        if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
            this.showNotification(`📈 Нужен уровень ${CONFIG.MIN_BREED_LEVEL}`, 'warning');
            return;
        }

        this.currentPet.isBreeding = true;
        this.currentPet.breedStartTime = Date.now();
        this.currentPet.satiety = 0;

        this.saveGame();
        this.updateUI();
        
        this.createBreedingEffect();
        this.showNotification('❤️ Начато размножение!', 'success');
    }

    // Эффекты
    createFeedEffect() {
        const container = document.querySelector('.pet-image-container');
        const effects = ['🍗', '🌾', '🥩'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        const element = document.createElement('div');
        element.className = 'feed-effect';
        element.textContent = effect;
        element.style.left = '50%';
        element.style.top = '50%';
        container.appendChild(element);
        
        setTimeout(() => container.removeChild(element), 600);
    }

    createLevelUpEffect() {
        const container = document.querySelector('.pet-image-container');
        const element = document.createElement('div');
        element.className = 'level-up-effect';
        element.textContent = '⭐';
        container.appendChild(element);
        
        setTimeout(() => container.removeChild(element), 1000);
    }

    createBreedingEffect() {
        const container = document.querySelector('.pet-card');
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'feed-effect';
                heart.textContent = '❤️';
                heart.style.left = Math.random() * 100 + '%';
                heart.style.top = Math.random() * 100 + '%';
                container.appendChild(heart);
                setTimeout(() => container.removeChild(heart), 1000);
            }, i * 200);
        }
    }

    createSwitchEffect(direction) {
        const petImage = document.getElementById('pet-image');
        petImage.style.transform = `translateX(${direction === 'left' ? '-20px' : '20px'})`;
        petImage.style.opacity = '0.5';
        
        setTimeout(() => {
            petImage.style.transform = 'translateX(0)';
            petImage.style.opacity = '1';
        }, 300);
    }

    showNotification(text, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = text;
        notification.className = `notification ${type} active`;
        
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }

    // Инвентарь
    loadInventoryData() {
        this.loadPetsInventory();
        this.loadAccessoriesInventory();
    }

    loadPetsInventory() {
        const grid = document.getElementById('pets-grid');
        grid.innerHTML = '';

        this.inventory.pets.forEach((pet, index) => {
            const petData = PETS_DATA[pet.petId];
            if (!petData) return;

            const card = document.createElement('div');
            card.className = `item-card rarity-${petData.rarity}`;
            card.innerHTML = `
                <img src="${petData.image}" alt="${petData.name}" class="item-image">
                <div class="item-name">${petData.name}</div>
                <div class="item-rarity rarity-${petData.rarity}">${RARITIES[petData.rarity].name}</div>
                <div class="item-level">Ур. ${pet.level}</div>
            `;

            card.addEventListener('click', () => {
                this.currentPetIndex = index;
                this.currentPet = pet;
                this.showScreen('pet-screen');
                this.updateUI();
            });

            grid.appendChild(card);
        });
    }

    loadAccessoriesInventory() {
        const grid = document.getElementById('accessories-grid');
        grid.innerHTML = '';

        this.inventory.accessories.forEach(accessory => {
            const accData = ACCESSORIES_DATA[accessory.id];
            if (!accData) return;

            const card = document.createElement('div');
            card.className = `item-card rarity-${accData.rarity}`;
            card.innerHTML = `
                <img src="${accData.image}" alt="${accData.name}" class="item-image">
                <div class="item-name">${accData.name}</div>
                <div class="item-rarity rarity-${accData.rarity}">${RARITIES[accData.rarity].name}</div>
                <div class="item-level">+${accData.farmBonus} фарм</div>
            `;

            grid.appendChild(card);
        });
    }

    // Рынок
    loadMarketData() {
        this.loadMarketPets();
        this.loadMarketAccessories();
    }

    loadMarketPets() {
        const list = document.getElementById('market-pets-list');
        list.innerHTML = '';

        // Тестовые данные для рынка
        const marketPets = [
            { petId: 2, price: 500, currency: 'stars' },
            { petId: 3, price: 1000, currency: 'stars' }
        ];

        marketPets.forEach(marketPet => {
            const petData = PETS_DATA[marketPet.petId];
            if (!petData) return;

            const item = document.createElement('div');
            item.className = 'market-item';
            item.innerHTML = `
                <img src="${petData.image}" alt="${petData.name}" class="market-item-image rarity-${petData.rarity}">
                <div class="market-item-info">
                    <div class="market-item-name">${petData.name}</div>
                    <div class="market-item-rarity rarity-${petData.rarity}">${RARITIES[petData.rarity].name}</div>
                    <div class="market-item-price">${marketPet.price} ${marketPet.currency === 'stars' ? '⭐' : '🌾'}</div>
                </div>
                <div class="market-item-actions">
                    <button class="btn btn-primary" onclick="game.buyPet(${marketPet.petId}, ${marketPet.price}, '${marketPet.currency}')">Купить</button>
                </div>
            `;

            list.appendChild(item);
        });
    }

    loadMarketAccessories() {
        const list = document.getElementById('market-accessories-list');
        list.innerHTML = '<div class="coming-soon">Скоро в продаже!</div>';
    }

    buyPet(petId, price, currency) {
        if (this.user.currencies[currency] < price) {
            this.showNotification(`❌ Недостаточно ${currency === 'stars' ? 'звёзд' : 'зёрен'}!`, 'error');
            return;
        }

        this.user.currencies[currency] -= price;

        const newPet = {
            id: this.generatePetId([petId, 0, 0, 0, 0]),
            petId: petId,
            accessories: [0, 0, 0, 0, 0],
            level: 1,
            satiety: 100,
            grainsEarned: 0,
            gromdEarned: 0,
            lastFed: Date.now(),
            isBreeding: false,
            breedStartTime: null,
            marketId: null
        };

        this.inventory.pets.push(newPet);
        this.saveGame();
        this.updateUI();
        this.showNotification(`🎉 Питомец куплен!`, 'success');
    }

    // Админ функции
    toggleAdminPanel() {
        const panel = document.getElementById('admin-panel');
        panel.classList.toggle('active');
    }

    addCurrency() {
        this.user.currencies.grains += 1000;
        this.user.currencies.stars += 100;
        this.user.currencies.gromd += 50;
        this.saveGame();
        this.updateUI();
        this.showNotification('💰 Валюта добавлена!', 'success');
    }

    fastGrowPet() {
        if (!this.currentPet) {
            this.showNotification('❌ Нет активного питомца', 'error');
            return;
        }

        this.currentPet.level = CONFIG.MAX_PET_LEVEL;
        this.currentPet.satiety = 100;
        this.currentPet.gromdEarned += 1000;
        this.user.currencies.gromd += 1000;
        this.user.currencies.grains += 5000;

        this.saveGame();
        this.updateUI();
        this.toggleAdminPanel();
        this.showNotification(`🚀 Питомец выращен до уровня ${CONFIG.MAX_PET_LEVEL}!`, 'success');
    }

    addRandomPet() {
        const petIds = Object.keys(PETS_DATA);
        const randomPetId = parseInt(petIds[Math.floor(Math.random() * petIds.length)]);
        
        const newPet = {
            id: this.generatePetId([randomPetId, 0, 0, 0, 0]),
            petId: randomPetId,
            accessories: [0, 0, 0, 0, 0],
            level: 1,
            satiety: 100,
            grainsEarned: 0,
            gromdEarned: 0,
            lastFed: Date.now(),
            isBreeding: false,
            breedStartTime: null
        };

        this.inventory.pets.push(newPet);
        this.saveGame();
        this.updateUI();
        this.toggleAdminPanel();
        this.showNotification('🐉 Новый питомец добавлен!', 'success');
    }

    resetGame() {
        if (confirm('Вы уверены, что хотите сбросить игру?')) {
            localStorage.removeItem('petGameData');
            location.reload();
        }
    }

    showExchangeModal() {
        this.showNotification('💱 Обмен валют скоро будет доступен!', 'info');
    }

    showWithdrawModal() {
        this.showNotification('🏦 Вывод после аирдропа!', 'info');
    }

    // Утилиты
    generatePetId(accessories) {
        return accessories.join('.');
    }

    formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    }

    saveGame() {
        const gameData = {
            user: this.user,
            inventory: this.inventory,
            currentPetIndex: this.currentPetIndex,
            market: this.market
        };
        localStorage.setItem('petGameData', JSON.stringify(gameData));
    }

    startBackgroundProcesses() {
        // Размножение
        setInterval(() => {
            this.checkBreedingCompletion();
        }, 1000);

        // Фарм зёрен
        setInterval(() => {
            this.calculateEarnings();
        }, 5000);

        // Автосохранение
        setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    checkBreedingCompletion() {
        if (!this.currentPet?.isBreeding) return;

        const breedingTime = Date.now() - this.currentPet.breedStartTime;
        if (breedingTime >= CONFIG.BREEDING.SATIETY_DURATION) {
            this.completeBreeding();
        }
    }

    completeBreeding() {
        const petData = PETS_DATA[this.currentPet.petId];
        
        this.currentPet.isBreeding = false;
        this.currentPet.breedStartTime = null;

        // Новый питомец
        let newPetId;
        if (Math.random() < petData.breedChance) {
            newPetId = this.getNextRarityPet(petData.rarity);
        } else {
            newPetId = this.currentPet.petId;
        }

        const newPet = {
            id: this.generatePetId([newPetId, 0, 0, 0, 0]),
            petId: newPetId,
            accessories: [0, 0, 0, 0, 0],
            level: 1,
            satiety: 100,
            grainsEarned: 0,
            gromdEarned: 0,
            lastFed: Date.now(),
            isBreeding: false,
            breedStartTime: null
        };

        this.inventory.pets.push(newPet);
        this.saveGame();
        this.updateUI();
        this.showNotification('🎉 Родился новый питомец!', 'success');
    }

    getNextRarityPet(currentRarity) {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const currentIndex = rarities.indexOf(currentRarity);
        const nextIndex = Math.min(currentIndex + 1, rarities.length - 1);
        
        const nextRarity = rarities[nextIndex];
        const availablePets = Object.values(PETS_DATA).filter(pet => pet.rarity === nextRarity);
        
        return availablePets.length > 0 ? availablePets[0].id : this.currentPet.petId;
    }

    calculateEarnings() {
        if (!this.currentPet) return;

        const petData = PETS_DATA[this.currentPet.petId];
        let farmRate = petData.farmRate;

        // Бонусы аксессуаров
        this.currentPet.accessories.forEach((accId, index) => {
            if (accId > 0) {
                const accessory = ACCESSORIES_DATA[`${index + 2}.${accId}`];
                if (accessory) {
                    farmRate += accessory.farmBonus;
                }
            }
        });

        const earnings = Math.floor(farmRate * (this.currentPet.satiety / 100));
        if (earnings > 0) {
            this.currentPet.grainsEarned += earnings;
            this.user.currencies.grains += earnings;
        }

        this.saveGame();
        this.updateUI();
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PetGame();
});