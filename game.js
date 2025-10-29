class PetGame {
    constructor() {
        this.user = null;
        this.currentPet = null;
        this.inventory = {
            pets: [],
            accessories: []
        };
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация игры...');
        
        // Инициализация Telegram Web App
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
                this.currentPet = data.currentPet;
                console.log('📁 Данные загружены из сохранения');
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
            firstName: tgUser?.first_name || 'Игрок',
            photoUrl: tgUser?.photo_url || 'https://via.placeholder.com/32',
            currencies: {
                grains: 1000,
                gromd: 0,
                ton: 0,
                stars: 100
            },
            isAdmin: true
        };

        // Создаем стартового питомца
        const starterPet = {
            id: '1.0.0.0.0',
            petId: 1,
            accessories: [0, 0, 0, 0, 0],
            level: 1,
            satiety: 50,
            grainsEarned: 0,
            gromdEarned: 0,
            lastFed: Date.now(),
            isBreeding: false,
            breedStartTime: null
        };

        this.inventory.pets = [starterPet];
        this.currentPet = starterPet;
        
        this.saveGame();
    }

    setupEventListeners() {
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
            });
        });

        // Вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTab(tab);
            });
        });

        // Действия с питомцем
        document.getElementById('feed-btn').addEventListener('click', () => {
            this.feedPet();
        });

        document.getElementById('breed-btn').addEventListener('click', () => {
            this.startBreeding();
        });

        // Кнопки кошелька
        document.getElementById('exchange-btn').addEventListener('click', () => {
            this.showExchangeModal();
        });

        document.getElementById('withdraw-btn').addEventListener('click', () => {
            this.showWithdrawModal();
        });

        // Админ панель
        document.getElementById('admin-btn').addEventListener('click', () => {
            this.toggleAdminPanel();
        });

        document.getElementById('reset-game-btn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('add-currency-btn').addEventListener('click', () => {
            this.addCurrency();
        });

        document.getElementById('view-players-btn').addEventListener('click', () => {
            this.viewPlayers();
        });

        // НОВАЯ КНОПКА: Быстрый рост питомца
        document.getElementById('fast-grow-btn').addEventListener('click', () => {
            this.fastGrowPet();
        });
        
        // Закрытие админ панели при клике вне ее
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.admin-panel') && !e.target.closest('.admin-btn')) {
                document.getElementById('admin-panel').classList.add('hidden');
            }
        });
    }

    // НОВЫЙ МЕТОД: Быстрый рост питомца
    fastGrowPet() {
        if (!this.currentPet) {
            this.showEffect('❌ Нет активного питомца', 'error');
            return;
        }

        // Повышаем уровень сразу до максимума
        const oldLevel = this.currentPet.level;
        this.currentPet.level = CONFIG.MAX_PET_LEVEL;
        
        // Восстанавливаем сытость
        this.currentPet.satiety = 100;
        
        // Добавляем GROMD
        this.currentPet.gromdEarned += 1000;
        this.user.currencies.gromd += 1000;
        
        // Добавляем зёрна
        this.user.currencies.grains += 5000;

        this.saveGame();
        this.updateUI();
        this.toggleAdminPanel();
        
        this.showEffect(`🚀 Питомец выращен до уровня ${CONFIG.MAX_PET_LEVEL}!`, 'success');
        this.createLevelUpEffect();
    }

    showScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Показываем нужный экран
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });

        // Загружаем данные для экрана
        if (screenName === 'inventory-screen') {
            this.loadInventoryData();
        } else if (screenName === 'market-screen') {
            this.loadMarketData();
        }
    }

    showTab(tabName) {
        // Обновляем кнопки вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Обновляем контент вкладок
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }

    updateUI() {
        if (!this.user || !this.currentPet) return;

        // Обновляем информацию о пользователе
        document.getElementById('user-photo').src = this.user.photoUrl;
        document.getElementById('user-name').textContent = this.user.firstName;
        document.getElementById('user-id').textContent = this.user.id;

        // Обновляем валюты в шапке
        document.getElementById('grains-amount').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('stars-amount').textContent = this.formatNumber(this.user.currencies.stars);

        // Обновляем кошелек
        document.getElementById('wallet-gromd').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('wallet-grains').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('wallet-ton').textContent = this.formatNumber(this.user.currencies.ton);
        document.getElementById('wallet-stars').textContent = this.formatNumber(this.user.currencies.stars);

        // Обновляем информацию о питомце
        this.updatePetUI();

        // Показываем/скрываем админ панель
        document.getElementById('admin-btn').style.display = this.user.isAdmin ? 'block' : 'none';
    }

    updatePetUI() {
        const petData = PETS_DATA[this.currentPet.petId];
        if (!petData) return;

        const rarity = RARITIES[petData.rarity];

        // Обновляем основную информацию
        document.getElementById('pet-image').src = petData.image;
        document.getElementById('pet-image').className = `rarity-${petData.rarity}`;
        document.getElementById('pet-name').textContent = petData.name;
        document.getElementById('pet-level').textContent = this.currentPet.level;
        document.getElementById('pet-rarity').textContent = rarity.name;
        document.getElementById('pet-rarity').className = `pet-rarity rarity-${petData.rarity}`;

        // Обновляем сытость
        const satietyPercent = this.currentPet.satiety;
        document.getElementById('satiety-fill').style.width = `${satietyPercent}%`;
        document.getElementById('satiety-text').textContent = `${this.currentPet.satiety}/100`;

        // Обновляем статистику
        document.getElementById('farm-rate').textContent = `${petData.farmRate} зёрен/5мин`;
        document.getElementById('grains-earned').textContent = this.currentPet.grainsEarned;

        // Обновляем стоимость кормления
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));
        document.getElementById('feed-cost').textContent = `${feedCost} зёрен`;

        // Обновляем кнопки
        this.updateButtons();
    }

    updateButtons() {
        const feedBtn = document.getElementById('feed-btn');
        const breedBtn = document.getElementById('breed-btn');

        // Кнопка кормления
        if (this.currentPet.satiety >= 100) {
            feedBtn.classList.add('disabled');
            feedBtn.disabled = true;
        } else {
            feedBtn.classList.remove('disabled');
            feedBtn.disabled = false;
        }

        // Кнопка размножения
        const canBreed = this.currentPet.level >= CONFIG.MIN_BREED_LEVEL && 
                        !this.currentPet.isBreeding && 
                        this.currentPet.satiety >= 100;

        if (canBreed) {
            breedBtn.classList.remove('disabled');
            breedBtn.disabled = false;
            breedBtn.querySelector('.btn-desc').textContent = '(готов к размножению)';
        } else {
            breedBtn.classList.add('disabled');
            breedBtn.disabled = true;
            
            if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
                breedBtn.querySelector('.btn-desc').textContent = `(нужен ур. ${CONFIG.MIN_BREED_LEVEL})`;
            } else if (this.currentPet.isBreeding) {
                breedBtn.querySelector('.btn-desc').textContent = '(в процессе)';
            } else if (this.currentPet.satiety < 100) {
                breedBtn.querySelector('.btn-desc').textContent = '(нужна сытость 100%)';
            }
        }
    }

    async feedPet() {
        if (!this.currentPet) {
            this.showEffect('❌ Нет активного питомца', 'error');
            return;
        }

        if (this.currentPet.satiety >= 100) {
            this.showEffect('🎯 Питомец уже сыт!', 'info');
            return;
        }

        const petData = PETS_DATA[this.currentPet.petId];
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));

        if (this.user.currencies.grains < feedCost) {
            this.showEffect('💸 Недостаточно зёрен!', 'error');
            return;
        }

        // Списание зёрен
        this.user.currencies.grains -= feedCost;

        // Увеличение сытости
        const newSatiety = Math.min(100, this.currentPet.satiety + petData.satietyPerFeed);
        this.currentPet.satiety = newSatiety;
        this.currentPet.lastFed = Date.now();

        // Начисление GROMD
        this.currentPet.gromdEarned += petData.gromdPerFeed;

        // Проверка уровня
        const leveledUp = this.checkLevelUp();

        this.saveGame();
        this.updateUI();
        
        // Эффект кормления
        this.createFeedEffect();
        this.showEffect(`🍗 +${petData.satietyPerFeed}% сытости`, 'success');

        if (leveledUp) {
            this.createLevelUpEffect();
        }
    }

    checkLevelUp() {
        if (this.currentPet.level < CONFIG.MAX_PET_LEVEL) {
            const neededExp = this.currentPet.level * 10;
            if (this.currentPet.gromdEarned >= neededExp) {
                this.currentPet.level++;
                this.showEffect(`🎉 Уровень ${this.currentPet.level}!`, 'levelup');
                return true;
            }
        }
        return false;
    }

    async startBreeding() {
        if (!this.currentPet) {
            this.showEffect('❌ Нет активного питомца', 'error');
            return;
        }

        if (this.currentPet.isBreeding) {
            this.showEffect('⏳ Питомец уже размножается!', 'info');
            return;
        }

        if (this.currentPet.satiety < 100) {
            this.showEffect('🍗 Нужна полная сытость!', 'warning');
            return;
        }

        if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
            this.showEffect(`📈 Нужен уровень ${CONFIG.MIN_BREED_LEVEL}`, 'warning');
            return;
        }

        this.currentPet.isBreeding = true;
        this.currentPet.breedStartTime = Date.now();
        this.currentPet.satiety = 0;

        this.saveGame();
        this.updateUI();
        
        this.createBreedingEffect();
        this.showEffect('❤️ Начато размножение!', 'success');
    }

    // НОВЫЕ МЕТОДЫ ДЛЯ ЭФФЕКТОВ

    createFeedEffect() {
        const petImage = document.getElementById('pet-image');
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            animation: floatUp 1s ease-out forwards;
            z-index: 100;
            pointer-events: none;
        `;
        effect.innerHTML = '🍗';
        
        petImage.parentElement.style.position = 'relative';
        petImage.parentElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentElement) {
                effect.parentElement.removeChild(effect);
            }
        }, 1000);
    }

    createLevelUpEffect() {
        const container = document.querySelector('.pet-image-container');
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
            border-radius: 20px;
            animation: glow 1.5s ease-out;
            z-index: 5;
            pointer-events: none;
        `;
        
        container.style.position = 'relative';
        container.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentElement) {
                effect.parentElement.removeChild(effect);
            }
        }, 1500);
    }

    createBreedingEffect() {
        const container = document.querySelector('.pet-card');
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,105,180,0.2) 0%, transparent 70%);
            border-radius: 16px;
            animation: pulse 2s ease-in-out;
            z-index: 5;
            pointer-events: none;
        `;
        
        container.style.position = 'relative';
        container.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentElement) {
                effect.parentElement.removeChild(effect);
            }
        }, 2000);
    }

    showEffect(text, type = 'info') {
        const effect = document.createElement('div');
        const types = {
            success: { bg: 'linear-gradient(135deg, #4CAF50, #45a049)', emoji: '✅' },
            error: { bg: 'linear-gradient(135deg, #f44336, #d32f2f)', emoji: '❌' },
            warning: { bg: 'linear-gradient(135deg, #FF9800, #F57C00)', emoji: '⚠️' },
            info: { bg: 'linear-gradient(135deg, #2196F3, #1976D2)', emoji: '💡' },
            levelup: { bg: 'linear-gradient(135deg, #FFD700, #FFC400)', emoji: '🎉' }
        };
        
        const config = types[type] || types.info;
        
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${config.bg};
            color: white;
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            font-weight: 600;
            font-size: 16px;
            max-width: 80%;
            animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s forwards;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        effect.innerHTML = `${config.emoji} ${text}`;
        document.body.appendChild(effect);

        setTimeout(() => {
            if (document.body.contains(effect)) {
                document.body.removeChild(effect);
            }
        }, 3000);
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

        // Определение нового питомца
        let newPetId;
        if (Math.random() < petData.breedChance) {
            newPetId = this.getNextRarityPet(petData.rarity);
        } else {
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
        
        this.showEffect('🎉 Родился новый питомец!', 'success');
        this.createBreedingEffect();
    }

    getNextRarityPet(currentRarity) {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const currentIndex = rarities.indexOf(currentRarity);
        const nextIndex = Math.min(currentIndex + 1, rarities.length - 1);
        
        const nextRarity = rarities[nextIndex];
        const availablePets = Object.values(PETS_DATA).filter(pet => pet.rarity === nextRarity);
        
        return availablePets.length > 0 ? availablePets[0].id : this.currentPet.petId;
    }

    generatePetId(accessories) {
        return accessories.join('.');
    }

    loadInventoryData() {
        this.loadPetsInventory();
        this.loadAccessoriesInventory();
    }

    loadPetsInventory() {
        const petsGrid = document.getElementById('pets-grid');
        if (!petsGrid) return;

        petsGrid.innerHTML = '';

        this.inventory.pets.forEach((pet, index) => {
            const petData = PETS_DATA[pet.petId];
            if (!petData) return;

            const petCard = document.createElement('div');
            petCard.className = `item-card rarity-${petData.rarity}`;
            petCard.innerHTML = `
                <img src="${petData.image}" alt="${petData.name}" class="item-image">
                <div class="item-name">${petData.name}</div>
                <div class="item-rarity rarity-${petData.rarity}">${RARITIES[petData.rarity].name}</div>
                <div class="item-level">Ур. ${pet.level}</div>
            `;

            petCard.addEventListener('click', () => {
                this.selectPet(pet);
            });

            petsGrid.appendChild(petCard);
        });

        document.getElementById('pets-count').textContent = this.inventory.pets.length;
    }

    loadAccessoriesInventory() {
        const accessoriesGrid = document.getElementById('accessories-grid');
        if (!accessoriesGrid) return;

        accessoriesGrid.innerHTML = '';

        const testAccessories = [
            {
                id: "2.1",
                name: "Золотая корона",
                rarity: "legendary", 
                image: "https://via.placeholder.com/60/ffd700/000000?text=👑",
                farmBonus: 20
            }
        ];

        testAccessories.forEach(accData => {
            const accCard = document.createElement('div');
            accCard.className = `item-card rarity-${accData.rarity}`;
            accCard.innerHTML = `
                <img src="${accData.image}" alt="${accData.name}" class="item-image">
                <div class="item-name">${accData.name}</div>
                <div class="item-rarity rarity-${accData.rarity}">${RARITIES[accData.rarity].name}</div>
                <div class="item-bonus">+${accData.farmBonus} фарм</div>
            `;

            accessoriesGrid.appendChild(accCard);
        });

        document.getElementById('accessories-count').textContent = testAccessories.length;
    }

    loadMarketData() {
        const marketPetsList = document.getElementById('market-pets-list');
        const marketAccessoriesList = document.getElementById('market-accessories-list');

        if (marketPetsList) {
            marketPetsList.innerHTML = `
                <div class="coming-soon">
                    <div style="text-align: center; padding: 40px 20px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🏪</div>
                        <div style="font-size: 16px; font-weight: 600;">Рынок откроется скоро!</div>
                    </div>
                </div>
            `;
        }

        if (marketAccessoriesList) {
            marketAccessoriesList.innerHTML = `
                <div class="coming-soon">
                    <div style="text-align: center; padding: 40px 20px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🛍️</div>
                        <div style="font-size: 16px; font-weight: 600;">Рынок аксессуаров</div>
                    </div>
                </div>
            `;
        }
    }

    selectPet(pet) {
        this.currentPet = pet;
        this.showScreen('pet-screen');
        this.updateUI();
        this.showEffect(`🎯 Выбран: ${PETS_DATA[pet.petId].name}`, 'info');
    }

    startBackgroundProcesses() {
        // Проверка размножения каждую секунду
        setInterval(() => {
            this.checkBreedingCompletion();
        }, 1000);

        // Начисление зёрен каждые 10 секунд
        setInterval(() => {
            this.calculateEarnings();
        }, 10000);

        // Автосохранение каждые 30 секунд
        setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    calculateEarnings() {
        if (!this.currentPet) return;

        const petData = PETS_DATA[this.currentPet.petId];
        let farmRate = petData.farmRate;

        const earnings = Math.floor(farmRate * (this.currentPet.satiety / 100) / 12);
        if (earnings > 0) {
            this.currentPet.grainsEarned += earnings;
            this.user.currencies.grains += earnings;
        }

        this.saveGame();
        this.updateUI();
    }

    toggleAdminPanel() {
        const panel = document.getElementById('admin-panel');
        panel.classList.toggle('hidden');
    }

    resetGame() {
        if (confirm('Вы уверены, что хотите полностью сбросить игру?')) {
            localStorage.removeItem('petGameData');
            location.reload();
        }
    }

    addCurrency() {
        this.user.currencies.grains += 1000;
        this.user.currencies.stars += 100;
        this.user.currencies.gromd += 50;
        this.saveGame();
        this.updateUI();
        this.showEffect('💰 Валюта добавлена!', 'success');
        this.toggleAdminPanel();
    }

    viewPlayers() {
        this.showEffect('👥 Список игроков в разработке', 'info');
        this.toggleAdminPanel();
    }

    showExchangeModal() {
        this.showEffect('💱 Обмен валют скоро будет!', 'info');
    }

    showWithdrawModal() {
        this.showEffect('🏦 Вывод после аирдропа', 'info');
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
}

// Запуск игры когда страница загружена
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PetGame();
});