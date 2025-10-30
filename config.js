const CONFIG = {
    ADMIN_IDS: ['1488847693'], // Замените на ваш Telegram ID
    CURRENCY_RATES: {
        STAR_TO_GRAIN: 5,
        TON_TO_GRAIN: 4000, // 0.1 TON = 400 зерен
        TON_TO_STAR: 300    // 0.1 TON = 30 звезд
    },
    BREEDING: {
        MIN_LEVEL: 5,
        BREEDING_TIME: 18 * 60 * 60 * 1000, // 18 часов
        COOLDOWN: 24 * 60 * 60 * 1000 // 24 часа
    },
    SECURITY: {
        MAX_FEED_PER_MINUTE: 10,
        ANOMALY_THRESHOLD: 1000
    },
    INVENTORY: {
        MAX_ACCESSORIES: 100,
        MAX_PETS: 50
    },
    MARKET: {
        TAX_RATE: 0.05, // 5% комиссия
        LISTING_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 дней
    }
};