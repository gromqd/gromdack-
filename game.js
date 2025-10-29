class PetGame {
    constructor() {
        this.user = null;
        this.currentPetIndex = 0;
        this.currentPet = null;
        this.inventory = {
            pets: [],
            accessories: []
        };
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация игры...');
        
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
        this.currentPetIndex = 0;
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

        // Стрелочки для переключения питомцев
        document.getElementById('prev-pet').addEventListener('click', () => {
            this.previousPet();
        });

        document.getElementById('next-pet').addEventListener('click', () => {
            this.nextPet();
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

        document.getElementById('fast-grow-btn').addEventListener('click', () => {
            this.fastGrowPet();
        });

        document.getElementById('view-players-btn').addEventListener('click', () => {
            this.viewPlayers();
        });

        // Закрытие админ панели
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.admin-panel') && !e.target.closest('.admin-btn')) {
                document.getElementById('admin-panel').classList.add('hidden');
            }
        });
    }

    // Переключение питомцев
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

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            }
        });

        if (screenName === 'inventory-screen') {
            this.loadInventoryData();
        } else if (screenName === 'market-screen') {
            this.loadMarketData();
        }
    }

    showTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

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
        document.getElementById('user-level').textContent = Math.floor(this.user.currencies.gromd / 100) + 1;

        // Обновляем валюты
        document.getElementById('grains-amount').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('gromd-amount').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('stars-amount').textContent = this.formatNumber(this.user.currencies.stars);

        // Обновляем кошелек
        document.getElementById('wallet-gromd').textContent = this.formatNumber(this.user.currencies.gromd);
        document.getElementById('wallet-grains').textContent = this.formatNumber(this.user.currencies.grains);
        document.getElementById('wallet-ton').textContent = this.formatNumber(this.user.currencies.ton);
        document.getElementById('wallet-stars').textContent = this.formatNumber(this.user.currencies.stars);

        // Обновляем информацию о питомце
        this.updatePetUI();

        // Показываем/скрываем админ панель
        document.getElementById('admin-btn').style.display = this.user.isAdmin ? 'flex' : 'none';
    }

    updatePetUI() {
        const petData = PETS_DATA[this.currentPet.petId];
        if (!petData) return;

        const rarity = RARITIES[petData.rarity];

        // Обновляем основную информацию
        document.getElementById('pet-image').src = petData.image;
        document.getElementById('pet-image').className = `pet-image rarity-${petData.rarity}`;
        document.getElementById('pet-name').textContent = petData.name;
        document.getElementById('pet-level').textContent = this.currentPet.level;
        document.getElementById('pet-rarity').textContent = rarity.name;
        document.getElementById('pet-rarity-badge').className = `pet-badge rarity-badge rarity-${petData.rarity}`;

        // Обновляем сытость
        const satietyPercent = this.currentPet.satiety;
        document.getElementById('satiety-fill').style.width = `${satietyPercent}%`;
        document.getElementById('satiety-text').textContent = `${this.currentPet.satiety}/100`;

        // Обновляем статистику
        document.getElementById('farm-rate').textContent = `${petData.farmRate}/5мин`;
        document.getElementById('grains-earned').textContent = this.currentPet.grainsEarned;

        // Обновляем стоимость кормления
        const feedCost = Math.floor(petData.feedCost * Math.pow(petData.costMultiplier, this.currentPet.level - 1));
        document.getElementById('feed-cost').textContent = `${feedCost} зёрен`;

        // Обновляем кнопки
        this.updateButtons();

        // Создаем частицы
        this.createParticles();
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
            document.getElementById('breed-desc').textContent = '(готов)';
        } else {
            breedBtn.classList.add('disabled');
            breedBtn.disabled = true;
            
            if (this.currentPet.level < CONFIG.MIN_BREED_LEVEL) {
                document.getElementById('breed-desc').textContent = `(ур. ${CONFIG.MIN_BREED_LEVEL}+)`;
            } else if (this.currentPet.isBreeding) {
                document.getElementById('breed-desc').textContent = '(в процессе)';
            } else if (this.currentPet.satiety < 100) {
                document.getElementById('breed-desc').textContent = '(сытость 100%)';
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
                this.showNotification(`🎉 Уровень ${this.currentPet.level}!`, 'levelup');
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
            this.showNotification('⏳ Питомец уже размножается!', 'info');
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

    // ЭФФЕКТЫ

    createFeedEffect() {
        const container = document.querySelector('.pet-image-container');
        const effects = ['🍗', '🌾', '🥩', '🍎'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                element.className = 'feed-effect';
                element.textContent = effect;
                element.style.left = Math.random() * 100 + '%';
                element.style.animationDelay = (i * 0.2) + 's';
                container.appendChild(element);
                
                setTimeout(() => {
                    if (element.parentElement) {
                        element.parentElement.removeChild(element);
                    }
                }, 1000);
            }, i * 200);
        }
    }

    createLevelUpEffect() {
        const container = document.querySelector('.pet-visual');
        const element = document.createElement('div');
        element.className = 'level-up-effect';
        element.textContent = '⭐';
        container.appendChild(element);
        
        setTimeout(() => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }, 1500);
    }

    createBreedingEffect() {
        const container = document.querySelector('.pet-card');
        const hearts = ['❤️', '💖', '💕', '💗'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                element.className = 'feed-effect';
                element.textContent = hearts[Math.floor(Math.random() * hearts.length)];
                element.style.left = Math.random() * 100 + '%';
                element.style.fontSize = (16 + Math.random() * 16) + 'px';
                container.appendChild(element);
                
                setTimeout(() => {
                    if (element.parentElement) {
                        element.parentElement.removeChild(element);
                    }
                }, 1000);
            }, i * 100);
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

    createParticles() {
        const container = document.getElementById('particles-container');
        if (!container) return;
        
        container.innerHTML = '';
        const petData = PETS_DATA[this.currentPet.petId];
        if (!petData) return;

        const color = getComputedStyle(document.documentElement)
            .getPropertyValue(`--accent-${petData.rarity}`) || '#667eea';

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.color = color;
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = (Math.random() * 2) + 's';
            container.appendChild(particle);
        }
    }

    showNotification(text, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-text">${text}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: '💡',
            levelup: '🎉'
        };
        return icons[type] || '💡';
    }

    // Админ функции
    fastGrowPet() {
        if (!this.currentPet) {
            this.showNotification('❌ Нет активного питомца', 'error');
            return;
        }

        const oldLevel = this.currentPet.level;
        this.currentPet.level = CONFIG.MAX_PET_LEVEL;
        this.currentPet.satiety = 100;
        this.currentPet.gromdEarned += 1000;
        this.user.currencies.gromd += 1000;
        this.user.currencies.grains += 5000;

        this.saveGame();
        this.updateUI();
        this.toggleAdminPanel();
        
        this.showNotification(`🚀 Питомец выращен до уровня ${CONFIG.MAX_PET_LEVEL}!`, 'success');
        this.createLevelUpEffect();
    }

    addCurrency() {
        this.user.currencies.grains += 1000;
        this.user.currencies.stars += 100;
        this.user.currencies.gromd += 50;
        this.saveGame();
        this.updateUI();
        this.showNotification('💰 Валюта добавлена!', 'success');
        this.toggleAdminPanel();
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

    viewPlayers() {
        this.showNotification('👥 Список игроков в разработке', 'info');
        this.toggleAdminPanel();
    }

    // Остальные методы остаются такими же, как в предыдущей версии
    // ... (loadInventoryData, loadMarketData, checkBreedingCompletion, etc.)

    formatNumber(num) {
        return new Intl.NumberFormat('ru-RU').format(num);
    }

    saveGame() {
        const gameData = {
            user: this.user,
            inventory: this.inventory,
            currentPetIndex: this.currentPetIndex
        };
        localStorage.setItem('petGameData', JSON.stringify(gameData));
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PetGame();
});
