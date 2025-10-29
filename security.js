// Расширенная система безопасности
class AdvancedSecurity {
    constructor() {
        this.checksums = {};
        this.suspiciousActions = [];
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.generateChecksums();
        this.setupEnvironmentChecks();
        this.setupMutationObserver();
        this.setupDevToolsDetection();
        this.startIntegrityChecks();
        this.setupAutoSave();
    }

    // Проверка целостности файлов
    generateChecksums() {
        this.checksums = {
            config: this.hashCode(JSON.stringify(CONFIG)),
            pets: this.hashCode(JSON.stringify(PETS_DATA)),
            accessories: this.hashCode(JSON.stringify(ACCESSORIES_DATA))
        };
    }

    // Обнаружение DevTools
    setupDevToolsDetection() {
        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > 100;
            const heightThreshold = window.outerHeight - window.innerHeight > 100;
            
            if (widthThreshold || heightThreshold) {
                this.logSuspiciousActivity('DevTools обнаружены');
                this.lockGame('Обнаружены инструменты разработчика');
            }
        };

        setInterval(checkDevTools, 1000);
        
        // Дополнительные проверки
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: () => {
                this.logSuspiciousActivity('Обход консоли обнаружен');
                this.lockGame('Попытка взлома обнаружена');
            }
        });
    }

    // Наблюдатель за изменениями DOM
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes') {
                    this.logSuspiciousActivity('Изменение атрибутов DOM', {
                        element: mutation.target.tagName,
                        attribute: mutation.attributeName
                    });
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    // Проверка окружения
    setupEnvironmentChecks() {
        // Проверка на ботов и эмуляторы
        if (navigator.webdriver || window.callPhantom || window._phantom) {
            this.lockGame('Обнаружено автоматизированное окружение');
        }

        // Проверка разрешения экрана
        if (screen.width < 300 || screen.height < 300) {
            this.logSuspiciousActivity('Подозрительное разрешение экрана');
        }

        // Проверка User Agent
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('headless') || userAgent.includes('phantom')) {
            this.lockGame('Обнаружен headless-браузер');
        }
    }

    // Проверки целостности
    startIntegrityChecks() {
        setInterval(() => {
            this.verifyGameData();
            this.verifyCurrencyValues();
            this.detectSpeedHacks();
        }, 5000);
    }

    // Проверка данных игры
    verifyGameData() {
        const currentConfigHash = this.hashCode(JSON.stringify(CONFIG));
        if (currentConfigHash !== this.checksums.config) {
            this.lockGame('Обнаружено изменение конфигурации игры');
        }

        // Проверка значений валют
        this.verifyCurrencyValues();
    }

    // Проверка валют на аномалии
    verifyCurrencyValues() {
        const currencies = window.game?.user?.currencies;
        if (!currencies) return;

        const limits = {
            grains: 1000000,
            gromd: 100000,
            ton: 10000,
            stars: 50000
        };

        for (const [currency, value] of Object.entries(currencies)) {
            if (value > limits[currency]) {
                this.logSuspiciousActivity(`Аномальное значение валюты: ${currency} = ${value}`);
                this.correctCurrencyValues();
                break;
            }

            if (value < 0) {
                this.logSuspiciousActivity(`Отрицательное значение валюты: ${currency}`);
                this.correctCurrencyValues();
                break;
            }
        }
    }

    // Обнаружение ускорения игры
    detectSpeedHacks() {
        const now = Date.now();
        if (window.lastTimeCheck) {
            const diff = now - window.lastTimeCheck;
            if (diff < 900 || diff > 1100) { // Должно быть ~1000ms
                this.logSuspiciousActivity('Возможное ускорение времени', { timeDiff: diff });
            }
        }
        window.lastTimeCheck = now;
    }

    // Автосохранение с проверкой
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (window.game && !this.cheatDetected) {
                const savedData = localStorage.getItem('petGameData');
                if (savedData) {
                    try {
                        const data = JSON.parse(savedData);
                        this.verifySaveData(data);
                    } catch (e) {
                        this.logSuspiciousActivity('Поврежденные данные сохранения');
                    }
                }
            }
        }, 30000); // Каждые 30 секунд
    }

    // Проверка данных сохранения
    verifySaveData(data) {
        if (!data.user || !data.inventory) {
            this.logSuspiciousActivity('Некорректные данные сохранения');
            return false;
        }

        // Проверка структуры пользователя
        const requiredUserFields = ['id', 'currencies', 'firstName'];
        for (const field of requiredUserFields) {
            if (!data.user[field]) {
                this.logSuspiciousActivity(`Отсутствует поле пользователя: ${field}`);
                return false;
            }
        }

        return true;
    }

    // Коррекция значений валют
    correctCurrencyValues() {
        if (!window.game?.user) return;

        const currencies = window.game.user.currencies;
        const limits = {
            grains: 1000000,
            gromd: 100000,
            ton: 10000,
            stars: 50000
        };

        for (const [currency, limit] of Object.entries(limits)) {
            if (currencies[currency] > limit) {
                currencies[currency] = Math.floor(limit * 0.8);
            }
            if (currencies[currency] < 0) {
                currencies[currency] = 0;
            }
        }

        window.game.saveGame();
        this.showSecurityMessage('Обнаружены аномалии. Значения скорректированы.');
    }

    // Логирование подозрительных действий
    logSuspiciousActivity(type, data = {}) {
        const activity = {
            type,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...data
        };

        this.suspiciousActions.push(activity);
        
        // Сохраняем в localStorage для анализа
        const existingLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
        existingLogs.push(activity);
        localStorage.setItem('securityLogs', JSON.stringify(existingLogs.slice(-100))); // Последние 100 записей

        console.warn('🔒 Security Alert:', activity);

        // Отправляем на сервер (если есть)
        this.reportToServer(activity);
    }

    // Отчет на сервер
    async reportToServer(activity) {
        try {
            // В реальной игре здесь будет отправка на ваш сервер
            if (window.game?.user) {
                activity.userId = window.game.user.id;
            }
            
            // Пример отправки (раскомментировать когда будет сервер)
            // await fetch('https://your-server.com/security-log', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(activity)
            // });
        } catch (error) {
            console.error('Ошибка отправки лога безопасности:', error);
        }
    }

    // Блокировка игры
    lockGame(reason) {
        this.cheatDetected = true;
        
        // Показываем сообщение
        document.body.innerHTML = `
            <div style="
                background: #000;
                color: #fff;
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <h1 style="color: #ff4444;">🚫 Обнаружена попытка взлома</h1>
                <p>Причина: ${reason}</p>
                <p>Игра заблокирована для вашей безопасности.</p>
                <p style="margin-top: 20px; font-size: 12px; color: #888;">
                    ID инцидента: ${Date.now()}
                </p>
            </div>
        `;

        // Очищаем данные
        localStorage.removeItem('petGameData');
        
        throw new Error(`Game locked: ${reason}`);
    }

    // Показать сообщение безопасности
    showSecurityMessage(text) {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            document.body.removeChild(message);
        }, 5000);
    }

    // Хеш-функция
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // Получить логи для админа
    getSecurityLogs() {
        return this.suspiciousActions;
    }

    // Сброс системы безопасности
    resetSecurity() {
        this.suspiciousActions = [];
        this.cheatDetected = false;
        localStorage.removeItem('securityLogs');
    }
}

// Инициализация безопасности
window.securitySystem = new AdvancedSecurity();