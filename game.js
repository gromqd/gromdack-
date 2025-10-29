// В начале файла game.js добавить:
class PetGame {
    constructor() {
        this.user = null;
        this.currentPet = null;
        this.inventory = {
            pets: [],
            accessories: []
        };
        this.security = window.securitySystem;
        
        this.init();
    }

    async init() {
        try {
            // Инициализация безопасности
            this.security.init();
            
            // Проверка перед загрузкой
            if (!this.security.verifyEnvironment()) {
                return;
            }

            // Остальная инициализация...
            this.tg = window.Telegram.WebApp;
            this.tg.expand();
            
            await this.loadUserData();
            this.setupEventListeners();
            this.updateUI();
            this.startBackgroundProcesses();

        } catch (error) {
            console.error('Ошибка инициализации игры:', error);
            this.security.lockGame('Ошибка инициализации');
        }
    }

    // Обновленные методы с проверками безопасности
    async feedPet() {
        if (!this.security.verifyAction('feed')) return;
        
        // Остальная логика кормления...
    }

    async startBreeding() {
        if (!this.security.verifyAction('breed')) return;
        
        // Остальная логика размножения...
    }
}
// Основной класс игры
class PetGame {
    constructor() {
        this.user = null;
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
        // Инициализация Telegram Web App
        this.tg = window.Telegram.WebApp;
        this.tg.expand();
        
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        
        // Запуск фоновых процессов
        this.startBackgroundProcesses();
    }

    async loadUserData() {
        // В реальном проекте здесь будет загрузка с сервера
        // Сейчас используем localStorage для демонстрации
        
        const savedData = localStorage.getItem('petGameData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.user = data.user;
            this.inventory = data.inventory;
            this.currentPet = data.currentPet;
        } else {
            // Создаем нового пользователя
            this.user = {
                id: this.tg.initDataUnsafe.user?.id || Date.now(),
                firstName: this.tg.initDataUnsafe.user?.first_name || 'Player',
                photoUrl: this.tg.initDataUnsafe.user?.photo_url || '',
                currencies: {
                    grains: 1000,
                    gromd: 0,
                    ton: 0,
                    stars: 100
                },
                isAdmin: CONFIG.ADMIN_IDS.includes(String(this.tg.initDataUnsafe.user?.id))
            };

            // Даем стартового питомца
            this.inventory.pets = [{
                id: this.generatePetId([1, 0, 0, 0, 0]),
                petId: 1,
                accessories: [0, 0, 0, 0, 0],
                level: 1,
                satiety: 100,
                grainsEarned: 0,
                gromdEarned: 0,
                lastFed: Date.now(),
                isBreeding: false,
                breedStartTime: null
            }];

            this.currentPet = this.inventory.pets[0];
            this.saveGame();
        }
    }

    generatePetId(accessories) {
        return accessories.join('.');
    }

    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.target.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Действия с питомцем
        document.getElementById('feed-btn').addEventListener('click', () => this.feedPet());
        document.getElementById('breed-btn').addEventListener('click', () => this.startBreeding());

        // Админ панель
        document.getElementById('admin-btn').addEventListener('click', () => this.toggleAdminPanel());
        document.getElementById('reset-game-btn').addEventListener('click', () => this.resetGame());
        
        // Обмен валют
        document.getElementById('exchange-btn').addEventListener('click', () => this.showExchangeModal());
    }

    showScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Показываем нужный экран
        document.getElementById(screenName).classList.add('active');

        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });

        // Загружаем данные для экрана
        if (screenName === 'market-screen') {
            this.loadMarketData();
        } else if (screenName === 'inventory-screen') {
            this.loadInventoryData();
        }
    }

    updateUI() {
        // Обновляем информацию о пользователе
        document.getElementById('user-photo').src = this.user.photoUrl;
        document.getElementById('user-name').textContent = this.user.firstName;
        document.getElementById('user-id').textContent = this.user.id;

        // Обновляем валюты
        document.getElementById('grains-amount').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('gromd-amount').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('ton-amount').textContent = this.formatNumber(this.user.currencies.ton);
        document.getElementById('stars-amount').textContent = this.formatNumber(this.user.currencies.stars);

        // Обновляем кошелек
        document.getElementById('main-gromd').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('wallet-grains').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('wallet-ton').textContent = this.formatNumber(this.user.currencies.ton);
        document.getElementById('wallet-stars').textContent = this.formatNumber(this.user.currencies.stars);

        // Обновляем информацию о питомце
        if (this.currentPet) {
            this.updatePetUI();
        }

        // Показываем/скрываем админ панель
        document.getElementById('admin-btn').style.display = this.user.isAdmin ? 'block' : 'none';
    }

    updatePetUI() {
        const petData = PETS_DATA[this.currentPet.petId];
        const rarity = RARITIES[petData.rarity];

        // Обновляем изображение и информацию
        document.getElementById('pet-image').src = petData.image;
        document.getElementById('pet-image').className = `rarity-${petData.rarity}`;
        document.getElementById('pet-level').textContent = this.currentPet.level;
        document.getElementById('pet-rarity').textContent = rarity.name;
        document.getElementById('pet-rarity').className = `pet-rarity rarity-${petData.rarity}`;

        // Обновляем сытость
        const satietyPercent = this.currentPet.satiety;
        document.getElementById('satiety-fill').style.width = `${satietyPercent}%`;
        document.getElementById('satiety-text').textContent = `${this.currentPet.satiety}/100`;

        // Обновляем заработок
        document.getElementById('grains-earned').textContent = this.currentPet.grainsEarned;

        // Обновляем кнопки
        const feedBtn = document.getElementById('feed-btn');
        const breedBtn = document.getElementById('breed-btn');

        if (this.currentPet.satiety >= 100) {
            feedBtn.classList.add('disabled');
            feedBtn.disabled = true;
        } else {
            feedBtn.classList.remove('disabled');
            feedBtn.disabled = false;
        }

        if (this.currentPet.level >= CONFIG.MIN_BREED_LEVEL && !this.currentPet.isBreeding && this.currentPet.satiety >= 100) {
            breedBtn.classList.remove('disabled');
            breedBtn.disabled = false;
        } else {
            breedBtn.classList.add('disabled');
            breedBtn.disabled = true;
        }
    }

    async feedPet() {
        if (!this.currentPet || this.currentPet.satiety >= 100) return;

        const petData = PETS_DATA[this.currentPet.petId];
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));

        if (this.user.currencies.grains < feedCost) {
            this.showMessage('Недостаточно зёрен!');
            return;
        }

        // Списание зёрен
        this.user.currencies.grains -= feedCost;

        // Увеличение сытости
        this.currentPet.satiety = Math.min(100, this.currentPet.satiety + petData.satietyPerFeed);
        this.currentPet.lastFed = Date.now();

        // Начисление GROMD
        this.currentPet.gromdEarned += petData.gromdPerFeed;

        this.saveGame();
        this.updateUI();
        this.showMessage(`Питомец покормлен! Сытость: +${petData.satietyPerFeed}%`);
    }

    async startBreeding() {
        if (!this.currentPet || this.currentPet.isBreeding || this.currentPet.satiety < 100) return;

        this.currentPet.isBreeding = true;
        this.currentPet.breedStartTime = Date.now();
        this.currentPet.satiety = 0;

        this.saveGame();
        this.updateUI();
        this.showMessage('Питомец начал размножение! Результат через 18 часов.');
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
        
        // Сброс состояния размножения
        this.currentPet.isBreeding = false;
        this.currentPet.breedStartTime = null;

        // Определение нового питомца на основе шанса
        let newPetId;
        if (Math.random() < petData.breedChance) {
            // Рождение питомца следующего ранга (упрощенная логика)
            newPetId = this.getNextRarityPet(petData.rarity);
        } else {
            // Рождение питомца того же типа
            newPetId = this.currentPet.petId;
        }

        // Создание нового питомца
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
        this.showMessage('Родился новый питомец!');
    }

    getNextRarityPet(currentRarity) {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const currentIndex = rarities.indexOf(currentRarity);
        const nextIndex = Math.min(currentIndex + 1, rarities.length - 1);
        
        // Находим питомца следующей редкости
        const nextRarity = rarities[nextIndex];
        const availablePets = Object.values(PETS_DATA).filter(pet => pet.rarity === nextRarity);
        
        return availablePets.length > 0 ? availablePets[0].id : this.currentPet.petId;
    }

    startBackgroundProcesses() {
        // Проверка размножения каждую минуту
        setInterval(() => {
            this.checkBreedingCompletion();
        }, 60000);

        // Начисление зёрен каждые 5 минут
        setInterval(() => {
            this.calculateEarnings();
        }, 300000);
    }

    calculateEarnings() {
        if (!this.currentPet) return;

        const petData = PETS_DATA[this.currentPet.petId];
        let farmRate = petData.farmRate;

        // Бонус от аксессуаров
        this.currentPet.accessories.forEach((accId, index) => {
            if (accId > 0) {
                const accessory = ACCESSORIES_DATA[`${index + 2}.${accId}`];
                if (accessory) {
                    farmRate += accessory.farmBonus;
                }
            }
        });

        // Начисление зёрен
        const earnings = Math.floor(farmRate * (this.currentPet.satiety / 100));
        this.currentPet.grainsEarned += earnings;
        this.user.currencies.grains += earnings;

        this.saveGame();
        this.updateUI();
    }

    toggleAdminPanel() {
        const panel = document.getElementById('admin-panel');
        panel.classList.toggle('hidden');
    }

    resetGame() {
        if (confirm('Вы уверены, что хотите сбросить все развитие?')) {
            localStorage.removeItem('petGameData');
            location.reload();
        }
    }

    showExchangeModal() {
        // В реальной игре здесь будет модальное окно обмена
        alert('Функция обмена валют будет доступна в следующем обновлении!');
    }

    showMessage(text) {
        // Простое уведомление (можно заменить на красивый toast)
        alert(text);
    }

    formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    }

    saveGame() {
        const gameData = {
            user: this.user,
            inventory: this.inventory,
            currentPet: this.currentPet
        };
        localStorage.setItem('petGameData', JSON.stringify(gameData));
    }

    // Методы для рынка и инвентаря будут добавлены в следующем обновлении
    loadMarketData() {
        // Загрузка данных рынка
    }

    loadInventoryData() {
        // Загрузка данных инвентаря
    }
}

// Запуск игры когда страница загружена
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PetGame();
});