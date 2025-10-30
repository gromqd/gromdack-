class PetGame {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.pets = [];
        this.accessories = [];
        this.userData = null;
        this.currentPetIndex = 0;
        this.currentPet = null;
        
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isAnimating = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация игры...');
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        
        await this.loadGameData();
        await this.loadUserData();
        this.setupEventListeners();
        this.render();
        this.startBackgroundProcesses();
        
        console.log('✅ Игра успешно запущена!');
    }

    async loadGameData() {
        try {
            const [petsResponse, accessoriesResponse] = await Promise.all([
                fetch('data/pets.json'),
                fetch('data/accessories.json')
            ]);
            
            this.pets = await petsResponse.json();
            this.accessories = await accessoriesResponse.json();
            console.log('📁 Загружены данные игры:', this.pets.length, 'питомцев,', this.accessories.length, 'аксессуаров');
        } catch (error) {
            console.error('❌ Ошибка загрузки данных игры:', error);
            this.pets = [];
            this.accessories = [];
        }
    }

    async loadUserData() {
        const tgUser = this.tg.initDataUnsafe?.user;
        this.user = {
            id: tgUser?.id || Date.now(),
            firstName: tgUser?.first_name || 'Игрок',
            photoUrl: tgUser?.photo_url || ''
        };

        console.log('👤 Пользователь:', this.user);

        const savedData = localStorage.getItem(`user_${this.user.id}`);
        this.userData = savedData ? JSON.parse(savedData) : this.createNewUser();
        
        this.currentPetIndex = 0;
        this.currentPet = this.userData.pets[this.currentPetIndex];
        
        console.log('💾 Загружены данные пользователя:', this.userData);
    }

    createNewUser() {
        const starterPet = this.pets.length > 0 ? {...this.pets[0]} : this.createDefaultPet();
        return {
            currencies: {
                grain: 100,
                gromd: 0,
                ton: 0,
                stars: 10
            },
            pets: [{
                ...starterPet,
                level: 1,
                satiety: 0,
                experience: 0,
                accessories: [0, 0, 0, 0],
                gromdCollected: 0,
                grainCollected: 0,
                lastFed: null,
                breedingEnds: null,
                canBreed: false
            }],
            accessories: [],
            logs: [],
            createdAt: Date.now(),
            security: {
                lastAction: Date.now(),
                actionCount: 0
            }
        };
    }

    createDefaultPet() {
        return {
            id: 1,
            name: "Дракончик",
            rarity: "common",
            farm_rate: 10,
            image: "",
            feed_cost: 10,
            cost_multiplier: 1.2,
            birth_chance: 0.1,
            satiety_per_feed: 15,
            gromd_per_feed: 0.1,
            base_price: 100
        };
    }

    setupEventListeners() {
        document.getElementById('feed-btn').addEventListener('click', () => this.feedPet());
        document.getElementById('inventory-btn').addEventListener('click', () => this.openInventory());
        document.getElementById('breed-btn').addEventListener('click', () => this.startBreeding());
        
        document.getElementById('prev-pet').addEventListener('click', () => this.previousPet());
        document.getElementById('next-pet').addEventListener('click', () => this.nextPet());
        
        this.setupSwipeListeners();
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                if (page === 'market') {
                    this.openMarket();
                } else if (page === 'wallet') {
                    this.openWallet();
                } else {
                    this.switchPage(page);
                }
            });
        });

        if (CONFIG.ADMIN_IDS.includes(this.user.id.toString())) {
            this.setupAdminPanel();
        }
    }

    setupSwipeListeners() {
        const carousel = document.getElementById('pets-carousel');
        
        carousel.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        carousel.addEventListener('mousedown', (e) => {
            this.touchStartX = e.screenX;
        });

        carousel.addEventListener('mouseup', (e) => {
            this.touchEndX = e.screenX;
            this.handleSwipe();
        });

        carousel.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleSwipe() {
        if (this.isAnimating) return;

        const swipeThreshold = 50;
        const swipeDistance = this.touchEndX - this.touchStartX;

        if (Math.abs(swipeDistance) < swipeThreshold) return;

        if (swipeDistance > 0) {
            this.previousPet();
        } else {
            this.nextPet();
        }
    }

    handleKeyPress(e) {
        if (this.isAnimating) return;

        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.previousPet();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.nextPet();
                break;
        }
    }

    previousPet() {
        if (this.isAnimating || this.currentPetIndex <= 0) return;
        this.switchPet(this.currentPetIndex - 1, 'left');
    }

    nextPet() {
        if (this.isAnimating || this.currentPetIndex >= this.userData.pets.length - 1) return;
        this.switchPet(this.currentPetIndex + 1, 'right');
    }

    switchPet(newIndex, direction) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        const carousel = document.getElementById('pets-carousel');
        const currentCard = carousel.children[this.currentPetIndex];
        const newCard = carousel.children[newIndex];

        if (direction === 'right') {
            currentCard.classList.add('slide-out-left');
            newCard.classList.add('slide-in-right');
        } else {
            currentCard.classList.add('slide-out-right');
            newCard.classList.add('slide-in-left');
        }

        setTimeout(() => {
            currentCard.classList.remove('active', 'slide-out-left', 'slide-out-right');
            newCard.classList.remove('slide-in-right', 'slide-in-left');
            newCard.classList.add('active');

            this.currentPetIndex = newIndex;
            this.currentPet = this.userData.pets[newIndex];
            
            this.updateNavigationArrows();
            this.updatePetsIndicator();
            this.updateActionButtons();
            this.isAnimating = false;
        }, 300);
    }

    feedPet() {
        if (!this.currentPet) {
            this.showMessage('Нет активного питомца!');
            return;
        }

        if (this.currentPet.satiety >= 100) {
            this.showMessage('Питомец уже сыт!');
            return;
        }

        const feedCost = this.calculateFeedCost();
        
        if (this.userData.currencies.grain < feedCost) {
            this.showMessage('Недостаточно зёрен!');
            return;
        }

        // Проверка безопасности
        if (!this.checkSecurity('feed')) {
            this.showMessage('Слишком много действий! Подождите.');
            return;
        }

        // Кормление
        this.userData.currencies.grain -= feedCost;
        this.currentPet.satiety = Math.min(100, this.currentPet.satiety + this.currentPet.satiety_per_feed);
        this.currentPet.gromdCollected += this.currentPet.gromd_per_feed;
        this.currentPet.lastFed = Date.now();

        this.logAction('feed', {
            petId: this.currentPet.id,
            cost: feedCost,
            satietyGained: this.currentPet.satiety_per_feed
        });

        this.saveUserData();
        this.render();
        this.showMessage(`Питомец покормлен! Сытость: ${Math.round(this.currentPet.satiety)}%`);
    }

    calculateFeedCost() {
        if (!this.currentPet.lastFed) return this.currentPet.feed_cost;
        
        const feedCount = this.userData.logs.filter(log => 
            log.action === 'feed' && log.data.petId === this.currentPet.id
        ).length;
        
        return Math.floor(this.currentPet.feed_cost * Math.pow(this.currentPet.cost_multiplier, feedCount));
    }

    startBreeding() {
        if (!this.currentPet || this.currentPet.level < 5) {
            this.showMessage('Питомец должен быть 5+ уровня для размножения!');
            return;
        }

        if (this.currentPet.satiety < 100) {
            this.showMessage('Питомец должен быть полностью сыт!');
            return;
        }

        if (this.currentPet.breedingEnds) {
            this.showMessage('Питомец уже размножается!');
            return;
        }

        this.currentPet.breedingEnds = Date.now() + CONFIG.BREEDING.BREEDING_TIME;
        this.currentPet.satiety = 0;
        
        this.logAction('breeding_start', { 
            petId: this.currentPet.id,
            breedingEnds: this.currentPet.breedingEnds 
        });

        this.saveUserData();
        this.updateActionButtons();
        this.showMessage('Питомец начал размножение! Результат через 18 часов.');
    }

    checkBreeding() {
        this.userData.pets.forEach(pet => {
            if (pet.breedingEnds && Date.now() >= pet.breedingEnds) {
                this.completeBreeding(pet);
            }
        });
    }

    completeBreeding(pet) {
        const newPet = this.generateOffspring(pet);
        this.userData.pets.push(newPet);
        pet.breedingEnds = null;
        
        this.logAction('breeding_complete', { 
            parentPetId: pet.id,
            offspringPetId: newPet.id 
        });

        this.saveUserData();
        this.render();
        this.showMessage('🎉 Родился новый питомец!');
    }

    generateOffspring(parentPet) {
        const possiblePets = this.pets.filter(p => 
            p.rarity === this.calculateOffspringRarity(parentPet)
        );
        
        const randomPet = possiblePets[Math.floor(Math.random() * possiblePets.length)] || this.pets[0];
        
        return {
            ...randomPet,
            level: 1,
            satiety: 0,
            experience: 0,
            accessories: [0, 0, 0, 0],
            gromdCollected: 0,
            grainCollected: 0,
            lastFed: null,
            breedingEnds: null,
            canBreed: false
        };
    }

    calculateOffspringRarity(parentPet) {
        const rand = Math.random();
        if (rand < parentPet.birth_chance) {
            const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            const currentIndex = rarities.indexOf(parentPet.rarity);
            return rarities[Math.min(currentIndex + 1, rarities.length - 1)];
        }
        return parentPet.rarity;
    }

    updateNavigationArrows() {
        const prevBtn = document.getElementById('prev-pet');
        const nextBtn = document.getElementById('next-pet');
        
        prevBtn.disabled = this.currentPetIndex === 0;
        nextBtn.disabled = this.currentPetIndex === this.userData.pets.length - 1;
    }

    updatePetsIndicator() {
        const indicator = document.getElementById('pets-indicator');
        indicator.innerHTML = '';

        this.userData.pets.forEach((pet, index) => {
            const dot = document.createElement('div');
            dot.className = `pet-indicator-dot ${index === this.currentPetIndex ? 'active' : ''} ${pet.gromdCollected > 0 ? 'has-gromd' : ''}`;
            dot.addEventListener('click', () => {
                if (index !== this.currentPetIndex) {
                    const direction = index > this.currentPetIndex ? 'right' : 'left';
                    this.switchPet(index, direction);
                }
            });
            indicator.appendChild(dot);
        });
    }

    updateActionButtons() {
        const feedCost = this.calculateFeedCost();
        document.getElementById('feed-cost').textContent = feedCost;

        const breedBtn = document.getElementById('breed-btn');
        if (this.currentPet.level >= 5 && this.currentPet.satiety === 100 && !this.currentPet.breedingEnds) {
            breedBtn.disabled = false;
            breedBtn.textContent = '❤️ Размножить';
        } else if (this.currentPet.breedingEnds) {
            breedBtn.disabled = true;
            const timeLeft = this.currentPet.breedingEnds - Date.now();
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                breedBtn.textContent = `⏳ ${hours}ч ${minutes}м`;
            } else {
                breedBtn.textContent = '🎉 Готов!';
            }
        } else {
            breedBtn.disabled = true;
            breedBtn.textContent = '❤️ Размножить';
        }
    }

    render() {
        this.updateUserInfo();
        this.updateCurrencyDisplay();
        this.renderPetsCarousel();
        this.updateNavigationArrows();
        this.updatePetsIndicator();
        this.updateActionButtons();
    }

    updateUserInfo() {
        document.getElementById('user-photo').src = this.user.photoUrl;
        document.getElementById('user-name').textContent = this.user.firstName;
        document.getElementById('user-id').textContent = `ID: ${this.user.id}`;
    }

    updateCurrencyDisplay() {
        document.getElementById('grain-balance').textContent = Math.floor(this.userData.currencies.grain);
        document.getElementById('gromd-balance').textContent = this.userData.currencies.gromd.toFixed(2);
        document.getElementById('ton-balance').textContent = this.userData.currencies.ton.toFixed(1);
        document.getElementById('star-balance').textContent = Math.floor(this.userData.currencies.stars);
    }

    renderPetsCarousel() {
        const carousel = document.getElementById('pets-carousel');
        carousel.innerHTML = '';

        this.userData.pets.forEach((pet, index) => {
            const petCard = this.createPetCard(pet, index);
            carousel.appendChild(petCard);
        });

        if (carousel.children[this.currentPetIndex]) {
            carousel.children[this.currentPetIndex].classList.add('active');
        }
    }

    createPetCard(pet, index) {
        const card = document.createElement('div');
        card.className = `pet-card ${pet.rarity} ${index === this.currentPetIndex ? 'active' : ''}`;
        card.dataset.petIndex = index;

        card.innerHTML = `
            <div class="pet-header">
                <span class="pet-level">Lv. <span class="level-text">${pet.level}</span></span>
                <span class="pet-rarity ${pet.rarity}">${this.getRarityName(pet.rarity)}</span>
            </div>
            <div class="pet-image-container">
                <img class="pet-image" src="${pet.image}" alt="${pet.name}" onerror="this.style.display='none'">
                <div class="accessory-overlay">
                    ${this.renderAccessories(pet.accessories)}
                </div>
            </div>
            <div class="pet-stats">
                <div class="satiety-bar">
                    <div class="satiety-fill" style="width: ${pet.satiety}%"></div>
                    <span class="satiety-text">${Math.round(pet.satiety)}%</span>
                </div>
                <div class="farm-info">
                    🌾 Собрано: <span class="grain-collected">${Math.round(pet.grainCollected)}</span>
                </div>
                <div class="gromd-info">
                    ⚡ GROMD: <span class="gromd-collected">${pet.gromdCollected.toFixed(2)}</span>
                </div>
            </div>
        `;

        return card;
    }

    renderAccessories(accessories) {
        let html = '';
        const types = ['hat', 'clothes', 'pants', 'hand-item'];
        
        accessories.forEach((accId, index) => {
            if (accId > 0) {
                const accessory = this.accessories.find(a => a.id === accId);
                if (accessory) {
                    html += `<img class="accessory ${types[index]}" src="${accessory.image}" alt="${accessory.name}" onerror="this.style.display='none'">`;
                }
            }
        });
        
        return html;
    }

    openInventory() {
        window.open('inventory.html', '_blank');
    }

    openMarket() {
        window.open('market.html', '_blank');
    }

    openWallet() {
        window.open('wallet.html', '_blank');
    }

    switchPage(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    startBackgroundProcesses() {
        setInterval(() => this.processBackgroundTasks(), 30000);
    }

    processBackgroundTasks() {
        this.collectResources();
        this.checkBreeding();
        this.saveUserData();
        this.render();
    }

    collectResources() {
        if (!this.currentPet) return;

        const now = Date.now();
        const timePassed = Math.min(now - (this.currentPet.lastFed || now), 300000) / 1000;

        if (this.currentPet.satiety > 0) {
            const grainsCollected = (this.currentPet.farm_rate / 300) * timePassed;
            this.currentPet.grainCollected += grainsCollected;
        }
    }

    checkSecurity(action) {
        const now = Date.now();
        const lastAction = this.userData.security.lastAction || now;
        
        if (now - lastAction < 1000) { // 1 секунда между действиями
            this.userData.security.actionCount = (this.userData.security.actionCount || 0) + 1;
            
            if (this.userData.security.actionCount > CONFIG.SECURITY.MAX_FEED_PER_MINUTE) {
                this.logSecurityAlert('Слишком частые действия');
                return false;
            }
        } else {
            this.userData.security.actionCount = 1;
        }
        
        this.userData.security.lastAction = now;
        return true;
    }

    logAction(action, data) {
        this.userData.logs.push({
            action,
            data,
            timestamp: Date.now(),
            userId: this.user.id
        });

        // Сохраняем только последние 1000 логов
        if (this.userData.logs.length > 1000) {
            this.userData.logs = this.userData.logs.slice(-1000);
        }
    }

    logSecurityAlert(reason) {
        console.warn('🚨 Security alert:', reason, this.user.id);
        this.logAction('security_alert', { reason, userId: this.user.id });
    }

    getRarityName(rarity) {
        const names = {
            common: 'Обычный',
            uncommon: 'Необычный',
            rare: 'Редкий',
            epic: 'Эпический',
            legendary: 'Легендарный'
        };
        return names[rarity] || rarity;
    }

    saveUserData() {
        try {
            localStorage.setItem(`user_${this.user.id}`, JSON.stringify(this.userData));
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error);
        }
    }

    showMessage(text) {
        this.tg.showPopup({
            title: '📢 Информация',
            message: text,
            buttons: [{ type: 'ok' }]
        });
    }

    setupAdminPanel() {
        const adminCorner = document.getElementById('admin-corner');
        adminCorner.style.display = 'flex';
        adminCorner.innerHTML = '⚙️';
        adminCorner.addEventListener('click', () => this.openAdminPanel());
    }

    openAdminPanel() {
        window.open('admin.html', '_blank');
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    new PetGame();
});