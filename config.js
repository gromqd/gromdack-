const CONFIG = {
    ADMIN_IDS: ['123456789'], // ЗАМЕНИТЕ НА ВАШ TELEGRAM ID
    CURRENCY_RATES: {
        STAR_TO_GRAIN: 5,
        TON_TO_GRAIN: 4000,
        TON_TO_STAR: 300
    },
    BREEDING: {
        SATIETY_DURATION: 30000, // 30 секунд для теста
        MIN_BREED_LEVEL: 2
    },
    MAX_PET_LEVEL: 10
};

const PETS_DATA = {
    1: {
        id: 1,
        name: "Fire Dragon",
        rarity: "legendary",
        farmRate: 50,
        image: "https://via.placeholder.com/200/FF6B6B/ffffff?text=🐉",
        feedCost: 100,
        costMultiplier: 1.5,
        breedChance: 0.3,
        satietyPerFeed: 20,
        gromdPerFeed: 2
    },
    2: {
        id: 2,
        name: "Water Snake",
        rarity: "epic",
        farmRate: 30,
        image: "https://via.placeholder.com/200/4ECDC4/ffffff?text=🐍",
        feedCost: 50,
        costMultiplier: 1.3,
        breedChance: 0.4,
        satietyPerFeed: 25,
        gromdPerFeed: 1
    },
    3: {
        id: 3,
        name: "Forest Wolf",
        rarity: "rare",
        farmRate: 20,
        image: "https://via.placeholder.com/200/45B7D1/ffffff?text=🐺",
        feedCost: 30,
        costMultiplier: 1.2,
        breedChance: 0.5,
        satietyPerFeed: 30,
        gromdPerFeed: 1
    }
};

const ACCESSORIES_DATA = {
    "2.1": {
        id: "2.1",
        category: 2,
        name: "Golden Crown",
        rarity: "legendary",
        image: "https://via.placeholder.com/60/FFD700/000000?text=👑",
        farmBonus: 20
    },
    "3.1": {
        id: "3.1",
        category: 3,
        name: "Knight Armor",
        rarity: "epic",
        image: "https://via.placeholder.com/60/9C27B0/ffffff?text=🛡️",
        farmBonus: 15
    }
};

const RARITIES = {
    common: { name: "Common", color: "#8E8E93" },
    uncommon: { name: "Uncommon", color: "#34C759" },
    rare: { name: "Rare", color: "#007AFF" },
    epic: { name: "Epic", color: "#AF52DE" },
    legendary: { name: "Legendary", color: "#FF9500" }
};