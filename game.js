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
        console.log('🐾 Текущий питомец:', this.currentPet);
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
        console.log('👤 Создание нового пользователя...');
        
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
            isAdmin: true // Для тестирования - всегда админ
        };

        // Создаем стартового питомца
        const starterPet = {
            id: '1.0.0.0.0',
            petId: 1,
            accessories: [0, 0, 0, 0, 0],
            level: 1,
            satiety: 50, // Начинаем с 50% для тестирования
            grainsEarned: 0,
            gromdEarned: 0,
            lastFed: Date.now(),
            isBreeding: false,
            breedStartTime: null
        };

        this.inventory.pets = [starterPet];
        this.currentPet = starterPet;
        
        this.saveGame();
        console.log('✅ Новый пользователь создан');
    }

    setupEventListeners() {
        console.log('🎮 Настройка обработчиков...');
        
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.showScreen(screen);
                console.log('🖥️ Переключение на экран:', screen);
            });
        });

        // Вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTab(tab);
            });
        });

        // Действия с питомцем - ОБНОВЛЕННЫЕ ОБРАБОТЧИКИ
        document.getElementById('feed-btn').addEventListener('click', () => {
            console.log('🍖 Нажата кнопка кормления');
            this.feedPet();
        });

        document.getElementById('breed-btn').addEventListener('click', () => {
            console.log('❤️ Нажата кнопка размножения');
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
        
        // Закрытие админ панели при клике вне ее
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.admin-panel') && !e.target.closest('.admin-btn')) {
                document.getElementById('admin-panel').classList.add('hidden');
            }
        });

        console.log('✅ Обработчики настроены');
    }

    showScreen(screenName) {
        console.log('🖥️ Переключение на экран:', screenName);
        
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
        console.log('📑 Переключение на вкладку:', tabName);
        
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
        if (!this.user || !this.currentPet) {
            console.error('❌ Нет данных пользователя или питомца');
            return;
        }

        console.log('🔄 Обновление интерфейса...');

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

        console.log('✅ Интерфейс обновлен');
    }

    updatePetUI() {
        const petData = PETS_DATA[this.currentPet.petId];
        if (!petData) {
            console.error('❌ Нет данных питомца с ID:', this.currentPet.petId);
            return;
        }

        console.log('🐾 Обновление UI питомца:', petData.name);

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

        console.log('🐾 UI питомца обновлен. Сытость:', this.currentPet.satiety);
    }

    updateButtons() {
        const feedBtn = document.getElementById('feed-btn');
        const breedBtn = document.getElementById('breed-btn');

        console.log('🔄 Обновление кнопок. Сытость:', this.currentPet.satiety);

        // Кнопка кормления
        if (this.currentPet.satiety >= 100) {
            feedBtn.classList.add('disabled');
            feedBtn.disabled = true;
            console.log('❌ Кнопка кормления заблокирована (сытость 100%)');
        } else {
            feedBtn.classList.remove('disabled');
            feedBtn.disabled = false;
            console.log('✅ Кнопка кормления активна');
        }

        // Кнопка размножения
        const canBreed = this.currentPet.level >= CONFIG.MIN_BREED_LEVEL && 
                        !this.currentPet.isBreeding && 
                        this.currentPet.satiety >= 100;

        if (canBreed) {
            breedBtn.classList.remove('disabled');
            breedBtn.disabled = false;
            console.log('✅ Кнопка размножения активна');
        } else {
            breedBtn.classList.add('disabled');
            breedBtn.disabled = true;
            
            // Показываем причину блокировки
            if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
                breedBtn.querySelector('.btn-desc').textContent = `(нужен ур. ${CONFIG.MIN_BREED_LEVEL})`;
            } else if (this.currentPet.isBreeding) {
                breedBtn.querySelector('.btn-desc').textContent = '(в процессе)';
            } else if (this.currentPet.satiety < 100) {
                breedBtn.querySelector('.btn-desc').textContent = '(нужна сытость 100%)';
            } else {
                breedBtn.querySelector('.btn-desc').textContent = '(недоступно)';
            }
            
            console.log('❌ Кнопка размножения заблокирована');
        }
    }

    async feedPet() {
        console.log('🍖 Начало кормления...');
        
        if (!this.currentPet) {
            this.showMessage('❌ Нет активного питомца');
            return;
        }

        if (this.currentPet.satiety >= 100) {
            this.showMessage('❌ Питомец уже сыт!');
            return;
        }

        const petData = PETS_DATA[this.currentPet.petId];
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));

        console.log('💵 Стоимость кормления:', feedCost, 'Зёрен у игрока:', this.user.currencies.grains);

        if (this.user.currencies.grains < feedCost) {
            this.showMessage('❌ Недостаточно зёрен!');
            return;
        }

        // Списание зёрен
        this.user.currencies.grains -= feedCost;

        // Увеличение сытости
        const newSatiety = Math.min(100, this.currentPet.satiety + petData.satietyPerFeed);
        console.log('🍗 Сытость до:', this.currentPet.satiety, 'После:', newSatiety);
        
        this.currentPet.satiety = newSatiety;
        this.currentPet.lastFed = Date.now();

        // Начисление GROMD
        this.currentPet.gromdEarned += petData.gromdPerFeed;

        // Проверка уровня
        this.checkLevelUp();

        this.saveGame();
        this.updateUI();
        this.showMessage(`✅ Питомец покормлен! Сытость: +${petData.satietyPerFeed}%`);

        // Анимация кнопки
        this.animateButton('feed-btn');
    }

    checkLevelUp() {
        const petData = PETS_DATA[this.currentPet.petId];
        const expPerFeed = 1;
        
        if (this.currentPet.level < CONFIG.MAX_PET_LEVEL) {
            const neededExp = this.currentPet.level * 10;
            if (this.currentPet.gromdEarned >= neededExp) {
                this.currentPet.level++;
                this.showMessage(`🎉 Уровень повышен! Теперь уровень ${this.currentPet.level}`);
            }
        }
    }

    async startBreeding() {
        console.log('❤️ Начало размножения...');
        
        if (!this.currentPet) {
            this.showMessage('❌ Нет активного питомца');
            return;
        }

        if (this.currentPet.isBreeding) {
            this.showMessage('❌ Питомец уже размножается!');
            return;
        }

        if (this.currentPet.satiety < 100) {
            this.showMessage('❌ Для размножения нужна полная сытость!');
            return;
        }

        if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
            this.showMessage(`❌ Размножение доступно с ${CONFIG.MIN_BREED_LEVEL} уровня`);
            return;
        }

        this.currentPet.isBreeding = true;
        this.currentPet.breedStartTime = Date.now();
        this.currentPet.satiety = 0;

        console.log('❤️ Размножение начато');

        this.saveGame();
        this.updateUI();
        this.showMessage('❤️ Питомец начал размножение! Результат через 30 секунд.');

        // Анимация кнопки
        this.animateButton('breed-btn');
    }

    animateButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }
    }

    checkBreedingCompletion() {
        if (!this.currentPet?.isBreeding) return;

        const breedingTime = Date.now() - this.currentPet.breedStartTime;
        console.log('⏰ Время размножения:', Math.round(breedingTime/1000), 'сек из', CONFIG.BREEDING.SATIETY_DURATION/1000);
        
        if (breedingTime >= CONFIG.BREEDING.SATIETY_DURATION) {
            this.completeBreeding();
        }
    }

    completeBreeding() {
        const petData = PETS_DATA[this.currentPet.petId];
        
        console.log('🎉 Размножение завершено!');

        // Сброс состояния размножения
        this.currentPet.isBreeding = false;
        this.currentPet.breedStartTime = null;

        // Определение нового питомца
        let newPetId;
        if (Math.random() < petData.breedChance) {
            // Рождение питомца следующего ранга
            newPetId = this.getNextRarityPet(petData.rarity);
            console.log('🎯 Родился питомец повышенной редкости!');
        } else {
            // Рождение питомца того же типа
            newPetId = this.currentPet.petId;
            console.log('🐾 Родился обычный питомец');
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
        this.showMessage('🎉 Родился новый питомец! Проверьте инвентарь.');
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

        // Добавим тестовые аксессуары
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
        // Заглушка для рынка
        const marketPetsList = document.getElementById('market-pets-list');
        const marketAccessoriesList = document.getElementById('market-accessories-list');

        if (marketPetsList) {
            marketPetsList.innerHTML = `
                <div class="coming-soon">
                    <div style="text-align: center; padding: 40px 20px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🏪</div>
                        <div style="font-size: 16px; font-weight: 600;">Рынок откроется скоро!</div>
                        <div style="font-size: 14px; margin-top: 8px;">Здесь можно будет покупать и продавать питомцев</div>
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
                        <div style="font-size: 14px; margin-top: 8px;">Скоро можно будет торговать аксессуарами</div>
                    </div>
                </div>
            `;
        }
    }

    selectPet(pet) {
        this.currentPet = pet;
        this.showScreen('pet-screen');
        this.updateUI();
        this.showMessage(`Выбран питомец: ${PETS_DATA[pet.petId].name}`);
    }

    startBackgroundProcesses() {
        console.log('🔄 Запуск фоновых процессов...');

        // Проверка размножения каждую секунду (для тестирования)
        setInterval(() => {
            this.checkBreedingCompletion();
        }, 1000);

        // Начисление зёрен каждые 10 секунд (для тестирования)
        setInterval(() => {
            this.calculateEarnings();
        }, 10000);

        // Автосохранение каждые 30 секунд
        setInterval(() => {
            this.saveGame();
        }, 30000);

        console.log('✅ Фоновые процессы запущены');
    }

    calculateEarnings() {
        if (!this.currentPet) return;

        const petData = PETS_DATA[this.currentPet.petId];
        let farmRate = petData.farmRate;

        // Бонус от аксессуаров
        this.currentPet.accessories.forEach((accId, index) => {
            if (accId > 0) {
                const accessoryKey = `${index + 2}.${accId}`;
                const accessory = ACCESSORIES_DATA[accessoryKey];
                if (accessory) {
                    farmRate += accessory.farmBonus;
                }
            }
        });

        // Начисление зёрен (упрощенно)
        const earnings = Math.floor(farmRate * (this.currentPet.satiety / 100) / 12); // Делим на 12 т.к. интервал 10 сек вместо 5 мин
        if (earnings > 0) {
            this.currentPet.grainsEarned += earnings;
            this.user.currencies.grains += earnings;
            console.log('💰 Начислено зёрен:', earnings);
        }

        this.saveGame();
        this.updateUI();
    }

    toggleAdminPanel() {
        const panel = document.getElementById('admin-panel');
        panel.classList.toggle('hidden');
        console.log('⚙️ Админ панель:', panel.classList.contains('hidden') ? 'скрыта' : 'открыта');
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
        this.showMessage('💰 Валюта добавлена!');
        this.toggleAdminPanel();
    }

    viewPlayers() {
        this.showMessage('👥 Список игроков будет в следующем обновлении');
        this.toggleAdminPanel();
    }

    showExchangeModal() {
        this.showMessage('💱 Обмен валют будет доступен в следующем обновлении');
    }

    showWithdrawModal() {
        this.showMessage('🏦 Вывод средств будет доступен после аирдропа');
    }

    showMessage(text) {
        // Создаем красивое уведомление
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 1px solid #333;
            backdrop-filter: blur(10px);
            font-weight: 600;
            max-width: 80%;
        `;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 3000);
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
    console.log('📄 DOM загружен, запуск игры...');
    window.game = new PetGame();
});

// Добавим глобальную функцию для отладки
window.debugGame = function() {
    console.log('🔍 Отладка игры:');
    console.log('👤 Пользователь:', window.game?.user);
    console.log('🐾 Текущий питомец:', window.game?.currentPet);
    console.log('🎒 Инвентарь:', window.game?.inventory);
    console.log('💾 Сохраненные данные:', localStorage.getItem('petGameData'));
};