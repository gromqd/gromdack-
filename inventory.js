class Inventory {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.gameData = null;
        this.currentTab = 'accessories';
        this.currentFilter = 'all';
        this.selectedAccessory = null;
        
        this.init();
    }

    async init() {
        console.log('🎒 Инициализация инвентаря...');
        this.tg.expand();
        await this.loadData();
        this.setupEventListeners();
        this.render();
        console.log('✅ Инвентарь готов!');
    }

    async loadData() {
        const tgUser = this.tg.initDataUnsafe?.user;
        const userId = tgUser?.id || 'test';
        const savedData = localStorage.getItem(`user_${userId}`);
        this.userData = savedData ? JSON.parse(savedData) : { accessories: [], pets: [] };

        try {
            const [petsResponse, accessoriesResponse] = await Promise.all([
                fetch('data/pets.json'),
                fetch('data/accessories.json')
            ]);
            this.gameData = {
                pets: await petsResponse.json(),
                accessories: await accessoriesResponse.json()
            };
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.gameData = { pets: [], accessories: [] };
        }
    }

    setupEventListeners() {
        document.getElementById('back-btn').addEventListener('click', () => {
            window.close();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchFilter(e.target.dataset.type);
            });
        });

        document.getElementById('close-equip-modal').addEventListener('click', () => {
            this.closeEquipModal();
        });
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

    switchFilter(type) {
        this.currentFilter = type;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        this.renderAccessories();
    }

    render() {
        if (this.currentTab === 'accessories') {
            this.renderAccessories();
        } else {
            this.renderPets();
        }
    }

    renderAccessories() {
        const grid = document.getElementById('accessories-grid');
        grid.innerHTML = '';

        let accessoriesToShow = this.userData.accessories || [];

        if (this.currentFilter !== 'all') {
            accessoriesToShow = accessoriesToShow.filter(acc => 
                this.getAccessoryById(acc.id)?.type === this.currentFilter
            );
        }

        if (accessoriesToShow.length === 0) {
            grid.innerHTML = '<div class="empty-state">📭 Нет аксессуаров</div>';
            return;
        }

        accessoriesToShow.forEach(userAcc => {
            const accessory = this.getAccessoryById(userAcc.id);
            if (!accessory) return;

            const isEquipped = this.isAccessoryEquipped(userAcc.id);
            const equippedPet = isEquipped ? this.getPetWithAccessory(userAcc.id) : null;

            const itemCard = document.createElement('div');
            itemCard.className = `item-card ${accessory.rarity}`;
            itemCard.innerHTML = `
                ${isEquipped ? '<div class="item-equipped">✅</div>' : ''}
                <img class="item-image" src="${accessory.image}" alt="${accessory.name}" onerror="this.style.display='none'">
                <div class="item-name">${accessory.name}</div>
                <div class="item-rarity">${this.getRarityName(accessory.rarity)}</div>
                <div class="item-stats">+${accessory.farm_bonus} 🌾/5мин</div>
                ${equippedPet ? `<div class="item-stats">На: ${equippedPet.name}</div>` : ''}
            `;

            itemCard.addEventListener('click', () => {
                if (!isEquipped) {
                    this.showEquipModal(userAcc.id);
                } else {
                    this.showMessage(`🎯 Аксессуар уже надет на ${equippedPet.name}`);
                }
            });

            grid.appendChild(itemCard);
        });
    }

    renderPets() {
        const list = document.getElementById('pets-list');
        list.innerHTML = '';

        if (!this.userData.pets || this.userData.pets.length === 0) {
            list.innerHTML = '<div class="empty-state">🐾 Нет питомцев</div>';
            return;
        }

        this.userData.pets.forEach((pet, index) => {
            const petItem = document.createElement('div');
            petItem.className = 'pet-list-item';
            
            const equippedAccessories = this.getEquippedAccessoriesForPet(pet);
            const accessoriesText = equippedAccessories.length > 0 
                ? `🎯 Аксессуары: ${equippedAccessories.length}` 
                : '📭 Нет аксессуаров';

            petItem.innerHTML = `
                <img class="pet-list-image" src="${pet.image}" alt="${pet.name}" onerror="this.style.display='none'">
                <div class="pet-list-info">
                    <div class="pet-list-name">${pet.name} (Ур. ${pet.level})</div>
                    <div class="pet-list-details">
                        ${this.getRarityName(pet.rarity)} • 🍖 Сытость: ${Math.round(pet.satiety)}%<br>
                        ${accessoriesText} • ⚡ GROMD: ${pet.gromdCollected.toFixed(2)}
                    </div>
                </div>
            `;

            list.appendChild(petItem);
        });
    }

    showEquipModal(accessoryId) {
        this.selectedAccessory = accessoryId;
        const modal = document.getElementById('equip-modal');
        const selection = document.getElementById('pets-selection');
        
        selection.innerHTML = '';

        if (!this.userData.pets || this.userData.pets.length === 0) {
            selection.innerHTML = '<div class="empty-state">🐾 Нет питомцев</div>';
        } else {
            this.userData.pets.forEach((pet, index) => {
                const canEquip = this.canEquipAccessory(accessoryId, pet);
                const petItem = document.createElement('div');
                petItem.className = `pet-select-item ${!canEquip ? 'disabled' : ''}`;
                petItem.innerHTML = `
                    <strong>${pet.name}</strong> (Ур. ${pet.level})<br>
                    <small>${this.getRarityName(pet.rarity)} • 🍖 ${Math.round(pet.satiety)}%</small>
                    ${!canEquip ? '<br><small style="color: #ff4444;">❌ Занято</small>' : ''}
                `;

                if (canEquip) {
                    petItem.addEventListener('click', () => {
                        this.equipAccessory(accessoryId, pet.id);
                    });
                }

                selection.appendChild(petItem);
            });
        }

        modal.classList.add('active');
    }

    closeEquipModal() {
        document.getElementById('equip-modal').classList.remove('active');
        this.selectedAccessory = null;
    }

    equipAccessory(accessoryId, petId) {
        const pet = this.userData.pets.find(p => p.id === petId);
        const accessory = this.getAccessoryById(accessoryId);
        
        if (!pet || !accessory) {
            this.showMessage('❌ Ошибка: не найдены питомец или аксессуар');
            return;
        }

        const accessoryTypeIndex = this.getAccessoryTypeIndex(accessory.type);
        if (pet.accessories[accessoryTypeIndex] > 0) {
            this.showMessage('❌ На питомце уже надет аксессуар этого типа!');
            return;
        }

        pet.accessories[accessoryTypeIndex] = accessoryId;
        pet.farm_rate = (pet.farm_rate || 0) + accessory.farm_bonus;

        this.saveUserData();
        this.closeEquipModal();
        this.render();
        
        this.showMessage(`✅ Аксессуар "${accessory.name}" надет на ${pet.name}!`);
    }

    canEquipAccessory(accessoryId, pet) {
        const accessory = this.getAccessoryById(accessoryId);
        if (!accessory) return false;

        const accessoryTypeIndex = this.getAccessoryTypeIndex(accessory.type);
        return pet.accessories[accessoryTypeIndex] === 0;
    }

    getAccessoryById(id) {
        return this.gameData.accessories.find(acc => acc.id === id);
    }

    getAccessoryTypeIndex(type) {
        const types = { 'hat': 0, 'clothes': 1, 'pants': 2, 'hand': 3 };
        return types[type] || 0;
    }

    isAccessoryEquipped(accessoryId) {
        return this.userData.pets.some(pet => 
            pet.accessories.includes(accessoryId)
        );
    }

    getPetWithAccessory(accessoryId) {
        return this.userData.pets.find(pet => 
            pet.accessories.includes(accessoryId)
        );
    }

    getEquippedAccessoriesForPet(pet) {
        return pet.accessories
            .filter(accId => accId > 0)
            .map(accId => this.getAccessoryById(accId))
            .filter(acc => acc);
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
        const tgUser = this.tg.initDataUnsafe?.user;
        const userId = tgUser?.id || 'test';
        localStorage.setItem(`user_${userId}`, JSON.stringify(this.userData));
    }

    showMessage(text) {
        this.tg.showPopup({
            title: '📢 Инвентарь',
            message: text,
            buttons: [{ type: 'ok' }]
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Inventory();
});