// Конфигурация игры
const CONFIG = {
    ADMIN_IDS: ['1488847693'], // Замените на ваш Telegram ID
    CURRENCY_RATES: {
        STAR_TO_GRAIN: 5,
        TON_TO_GRAIN: 4000, // 0.1 TON = 4000 зерен
        TON_TO_STAR: 300    // 0.1 TON = 300 звезд
    },
    BREEDING: {
        SATIETY_DURATION: 18 * 60 * 60 * 1000, // 18 часов в миллисекундах
        MIN_BREED_LEVEL: 5
    },
    MAX_PET_LEVEL: 10
};

// База данных питомцев (в реальном проекте это будет на сервере)
const PETS_DATA = {
    // Пример питомца - добавляйте своих по такому же формату
    1: {
        id: 1,
        name: "Огненный дракон",
        rarity: "legendary",
        farmRate: 50, // зерен в 5 минут
        image: "images/pets/dragon.png",
        feedCost: 100,
        costMultiplier: 1.5,
        breedChance: 0.1, // 10% шанс при рождении
        satietyPerFeed: 15,
        gromdPerFeed: 2
    },
    2: {
        id: 2,
        name: "Водяная змея",
        rarity: "epic",
        farmRate: 30,
        image: "images/pets/snake.png",
        feedCost: 50,
        costMultiplier: 1.3,
        breedChance: 0.2,
        satietyPerFeed: 20,
        gromdPerFeed: 1
    }
};

// База данных аксессуаров
const ACCESSORIES_DATA = {
    // Формат: category_id.accessory_id
    "2.1": { // Головной убор
        id: "2.1",
        category: 2,
        name: "Золотая корона",
        rarity: "legendary",
        image: "images/accessories/crown.png",
        farmBonus: 20
    },
    "3.1": { // Верхняя одежда
        id: "3.1",
        category: 3,
        name: "Доспехи рыцаря",
        rarity: "epic",
        image: "images/accessories/armor.png",
        farmBonus: 15
    },
    "4.1": { // Штаны
        id: "4.1",
        category: 4,
        name: "Магические штаны",
        rarity: "rare",
        image: "images/accessories/pants.png",
        farmBonus: 10
    },
    "5.1": { // В руках
        id: "5.1",
        category: 5,
        name: "Волшебный посох",
        rarity: "legendary",
        image: "images/accessories/staff.png",
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