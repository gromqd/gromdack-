// Конфигурация игры
const CONFIG = {
    ADMIN_IDS: ['1488847693'], // ЗАМЕНИТЕ на ваш реальный Telegram ID
    CURRENCY_RATES: {
        STAR_TO_GRAIN: 5,
        TON_TO_GRAIN: 4000,
        TON_TO_STAR: 300
    },
    BREEDING: {
        SATIETY_DURATION: 30000, // 30 секунд для тестирования (вместо 18 часов)
        MIN_BREED_LEVEL: 2 // 2 для тестирования (вместо 5)
    },
    MAX_PET_LEVEL: 10
};

// База данных питомцев
const PETS_DATA = {
    1: {
        id: 1,
        name: "Огненный дракон",
        rarity: "legendary",
        farmRate: 50,
        image: "https://via.placeholder.com/150/ff6b6b/ffffff?text=🐉",
        feedCost: 100,
        costMultiplier: 1.5,
        breedChance: 0.3,
        satietyPerFeed: 20,
        gromdPerFeed: 2
    },
    2: {
        id: 2,
        name: "Водяная змея",
        rarity: "epic", 
        farmRate: 30,
        image: "https://via.placeholder.com/150/4ecdc4/ffffff?text=🐍",
        feedCost: 50,
        costMultiplier: 1.3,
        breedChance: 0.4,
        satietyPerFeed: 25,
        gromdPerFeed: 1
    },
    3: {
        id: 3,
        name: "Лесной волк",
        rarity: "rare",
        farmRate: 20,
        image: "https://via.placeholder.com/150/45b7d1/ffffff?text=🐺",
        feedCost: 30,
        costMultiplier: 1.2,
        breedChance: 0.5,
        satietyPerFeed: 30,
        gromdPerFeed: 1
    },
    4: {
        id: 4,
        name: "Небесный орел", 
        rarity: "uncommon",
        farmRate: 15,
        image: "https://via.placeholder.com/150/96ceb4/ffffff?text=🦅",
        feedCost: 20,
        costMultiplier: 1.1,
        breedChance: 0.6,
        satietyPerFeed: 35,
        gromdPerFeed: 0.5
    },
    5: {
        id: 5,
        name: "Земной медведь",
        rarity: "common",
        farmRate: 10,
        image: "https://via.placeholder.com/150/ccc/ffffff?text=🐻",
        feedCost: 10,
        costMultiplier: 1.1,
        breedChance: 0.7,
        satietyPerFeed: 40,
        gromdPerFeed: 0.5
    }
};

// База данных аксессуаров
const ACCESSORIES_DATA = {
    "2.1": {
        id: "2.1",
        category: 2,
        name: "Золотая корона",
        rarity: "legendary",
        image: "https://via.placeholder.com/60/ffd700/000000?text=👑",
        farmBonus: 20
    },
    "2.2": {
        id: "2.2", 
        category: 2,
        name: "Шляпа мага",
        rarity: "epic",
        image: "https://via.placeholder.com/60/9c27b0/ffffff?text=🎩",
        farmBonus: 15
    },
    "3.1": {
        id: "3.1",
        category: 3,
        name: "Доспехи рыцаря",
        rarity: "rare",
        image: "https://via.placeholder.com/60/2196f3/ffffff?text=🛡️",
        farmBonus: 12
    },
    "4.1": {
        id: "4.1",
        category: 4,
        name: "Магические штаны",
        rarity: "uncommon", 
        image: "https://via.placeholder.com/60/4caf50/ffffff?text=👖",
        farmBonus: 8
    },
    "5.1": {
        id: "5.1",
        category: 5,
        name: "Волшебный посох",
        rarity: "legendary",
        image: "https://via.placeholder.com/60/ff9800/ffffff?text=🔮",
        farmBonus: 25
    }
};

// Редкости и их цвета
const RARITIES = {
    common: { name: "Common", color: "#808080" },
    uncommon: { name: "Uncommon", color: "#4CAF50" },
    rare: { name: "Rare", color: "#2196F3" },
    epic: { name: "Epic", color: "#9C27B0" },
    legendary: { name: "Legendary", color: "#FF9800" }
};