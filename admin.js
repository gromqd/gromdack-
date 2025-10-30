class AdminPanel {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.usersData = {};
        this.currentTab = 'users';
        this.selectedUser = null;
        this.init();
    }

    async init() {
        console.log('⚙️ Инициализация админ-панели...');
        
        // Проверка прав администратора
        const tgUser = this.tg.initDataUnsafe?.user;
        if (!tgUser || !CONFIG.ADMIN_IDS.includes(tgUser.id.toString())) {
            this.showMessage('❌ Доступ запрещен!');
            window.close();
            return;
        }

        this.tg.expand();
        await this.loadAllUsers();
        this.setupEventListeners();
        this.render();
        console.log('✅ Админ-панель готова!');
    }

    async loadAllUsers() {
        this.usersData = {};
        
        // Загрузка всех пользователей из localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('user_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    const userId = key.replace('user_', '');
                    this.usersData[userId] = userData;
                } catch (error) {
                    console.error('❌ Ошибка загрузки пользователя:', key, error);
                }
            }
        }
        
        console.log(`📊 Загружено пользователей: ${Object.keys(this.usersData).length}`);
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

        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchUsers();
        });

        document.getElementById('user-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchUsers();
        });

        // Системные действия
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            this.resetAllData();
        });

        document.getElementById('add-currency-btn').addEventListener('click', () => {
            this.addCurrencyToTesters();
        });

        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Модальное окно
        document.getElementById('close-user-modal').addEventListener('click', () => {
            this.closeUserModal();
        });

        document.getElementById('ban-user-btn').addEventListener('click', () => {
            this.banUser();
        });

        document.getElementById('add-currency-user-btn').addEventListener('click', () => {
            this.addCurrencyToUser();
        });

        document.getElementById('reset-user-btn').addEventListener('click', () => {
            this.resetUserProgress();
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

    render() {
        switch(this.currentTab) {
            case 'users':
                this.renderUsers();
                break;
            case 'security':
                this.renderSecurity();
                break;
            case 'system':
                this.renderSystem();
                break;
        }
    }

    renderUsers() {
        const container = document.getElementById('users-list');
        container.innerHTML = '';

        const users = Object.entries(this.usersData);
        
        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state">👥 Нет данных об игроках</div>';
            return;
        }

        users.forEach(([userId, userData]) => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            
            const totalPets = userData.pets?.length || 0;
            const totalAccessories = userData.accessories?.length || 0;
            const totalGromd = userData.currencies?.gromd || 0;
            const isSuspicious = this.isUserSuspicious(userData);

            userElement.innerHTML = `
                <div class="user-header">
                    <span class="user-id">ID: ${userId}</span>
                    ${isSuspicious ? '<span class="suspicious-badge">🚨</span>' : ''}
                </div>
                <div class="user-stats">
                    <span>🐾 ${totalPets} пит.</span>
                    <span>👕 ${totalAccessories} акс.</span>
                    <span>⚡ ${totalGromd.toFixed(2)} GROMD</span>
                </div>
                <div class="user-joined">
                    Зарегистрирован: ${new Date(userData.createdAt).toLocaleDateString()}
                </div>
            `;

            userElement.addEventListener('click', () => {
                this.showUserModal(userId, userData);
            });

            container.appendChild(userElement);
        });
    }

    renderSecurity() {
        const totalUsers = Object.keys(this.usersData).length;
        const suspiciousUsers = Object.values(this.usersData).filter(user => 
            this.isUserSuspicious(user)
        ).length;
        const bannedUsers = Object.values(this.usersData).filter(user => 
            user.banned
        ).length;

        document.getElementById('total-users').textContent = totalUsers;
        document.getElementById('suspicious-users').textContent = suspiciousUsers;
        document.getElementById('banned-users').textContent = bannedUsers;

        this.renderSecurityLogs();
    }

    renderSecurityLogs() {
        const container = document.getElementById('security-logs');
        container.innerHTML = '';

        // Собираем все логи безопасности
        const allLogs = [];
        Object.entries(this.usersData).forEach(([userId, userData]) => {
            if (userData.logs) {
                userData.logs.forEach(log => {
                    if (log.action === 'security_alert') {
                        allLogs.push({
                            ...log,
                            userId: userId
                        });
                    }
                });
            }
        });

        // Сортируем по времени (новые сначала)
        allLogs.sort((a, b) => b.timestamp - a.timestamp);

        if (allLogs.length === 0) {
            container.innerHTML = '<div class="empty-state">📝 Нет событий безопасности</div>';
            return;
        }

        // Показываем последние 10 событий
        allLogs.slice(0, 10).forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = 'log-item';
            logElement.innerHTML = `
                <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-user">ID: ${log.userId}</div>
                <div class="log-message">${log.data.reason}</div>
            `;
            container.appendChild(logElement);
        });
    }

    renderSystem() {
        const totalPets = Object.values(this.usersData).reduce((sum, user) => 
            sum + (user.pets?.length || 0), 0);
        const totalAccessories = Object.values(this.usersData).reduce((sum, user) => 
            sum + (user.accessories?.length || 0), 0);

        document.getElementById('total-pets-admin').textContent = totalPets;
        document.getElementById('total-accessories-admin').textContent = totalAccessories;

        // Расчет размера данных
        const dataSize = JSON.stringify(this.usersData).length;
        document.getElementById('data-size').textContent = 
            Math.round(dataSize / 1024) + ' KB';
    }

    searchUsers() {
        const query = document.getElementById('user-search').value.toLowerCase();
        if (!query) {
            this.renderUsers();
            return;
        }

        const filteredUsers = Object.entries(this.usersData).filter(([userId, userData]) => 
            userId.toLowerCase().includes(query) || 
            (userData.currencies && query.includes('gromd') && userData.currencies.gromd > 1000)
        );

        const container = document.getElementById('users-list');
        container.innerHTML = '';

        if (filteredUsers.length === 0) {
            container.innerHTML = '<div class="empty-state">🔍 Игроки не найдены</div>';
            return;
        }

        filteredUsers.forEach(([userId, userData]) => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            
            const totalPets = userData.pets?.length || 0;
            const totalAccessories = userData.accessories?.length || 0;
            const totalGromd = userData.currencies?.gromd || 0;

            userElement.innerHTML = `
                <div class="user-header">
                    <span class="user-id">ID: ${userId}</span>
                </div>
                <div class="user-stats">
                    <span>🐾 ${totalPets} пит.</span>
                    <span>👕 ${totalAccessories} акс.</span>
                    <span>⚡ ${totalGromd.toFixed(2)} GROMD</span>
                </div>
            `;

            userElement.addEventListener('click', () => {
                this.showUserModal(userId, userData);
            });

            container.appendChild(userElement);
        });
    }

    showUserModal(userId, userData) {
        this.selectedUser = { userId, userData };
        
        document.getElementById('user-modal-title').textContent = 
            `👤 Информация об игроке #${userId}`;
        
        const totalPets = userData.pets?.length || 0;
        const totalAccessories = userData.accessories?.length || 0;
        const totalGromd = userData.currencies?.gromd || 0;
        const totalGrain = userData.currencies?.grain || 0;
        const totalStars = userData.currencies?.stars || 0;
        const totalTon = userData.currencies?.ton || 0;

        document.getElementById('user-details').innerHTML = `
            <div class="user-info-grid">
                <div class="info-item">
                    <span>🐾 Питомцы:</span>
                    <span>${totalPets}</span>
                </div>
                <div class="info-item">
                    <span>👕 Аксессуары:</span>
                    <span>${totalAccessories}</span>
                </div>
                <div class="info-item">
                    <span>⚡ GROMD:</span>
                    <span>${totalGromd.toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <span>🌾 Зёрна:</span>
                    <span>${totalGrain}</span>
                </div>
                <div class="info-item">
                    <span>⭐ Звёзды:</span>
                    <span>${totalStars}</span>
                </div>
                <div class="info-item">
                    <span>💎 TON:</span>
                    <span>${totalTon.toFixed(1)}</span>
                </div>
                <div class="info-item">
                    <span>📅 Регистрация:</span>
                    <span>${new Date(userData.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                    <span>🚨 Статус:</span>
                    <span>${userData.banned ? '🚫 Заблокирован' : '✅ Активен'}</span>
                </div>
            </div>
        `;

        document.getElementById('user-modal').classList.add('active');
    }

    closeUserModal() {
        document.getElementById('user-modal').classList.remove('active');
        this.selectedUser = null;
    }

    banUser() {
        if (!this.selectedUser) return;

        const { userId, userData } = this.selectedUser;
        userData.banned = !userData.banned;
        
        localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
        this.usersData[userId] = userData;

        this.showMessage(
            userData.banned ? 
            `🚫 Игрок #${userId} заблокирован` :
            `✅ Игрок #${userId} разблокирован`
        );

        this.closeUserModal();
        this.render();
    }

    addCurrencyToUser() {
        if (!this.selectedUser) return;

        const { userId, userData } = this.selectedUser;
        
        userData.currencies.grain += 1000;
        userData.currencies.stars += 100;
        userData.currencies.ton += 1;
        userData.currencies.gromd += 10;
        
        localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
        this.usersData[userId] = userData;

        this.showMessage(`✅ Валюта добавлена игроку #${userId}`);
        this.closeUserModal();
        this.render();
    }

    resetUserProgress() {
        if (!this.selectedUser) return;

        const { userId } = this.selectedUser;
        
        // Создаем нового пользователя с начальными данными
        const newUserData = {
            currencies: {
                grain: 100,
                gromd: 0,
                ton: 0,
                stars: 10
            },
            pets: [],
            accessories: [],
            logs: [],
            createdAt: Date.now(),
            security: {
                lastAction: Date.now(),
                actionCount: 0
            }
        };
        
        localStorage.setItem(`user_${userId}`, JSON.stringify(newUserData));
        this.usersData[userId] = newUserData;

        this.showMessage(`🔄 Прогресс игрока #${userId} сброшен`);
        this.closeUserModal();
        this.render();
    }

    resetAllData() {
        if (!confirm('❌ ВНИМАНИЕ! Вы уверены что хотите сбросить ВСЕ данные игры?')) {
            return;
        }

        // Удаляем все данные пользователей
        Object.keys(this.usersData).forEach(userId => {
            localStorage.removeItem(`user_${userId}`);
        });

        this.usersData = {};
        this.showMessage('🗑️ Все данные игры сброшены!');
        this.render();
    }

    addCurrencyToTesters() {
        Object.entries(this.usersData).forEach(([userId, userData]) => {
            userData.currencies.grain += 5000;
            userData.currencies.stars += 500;
            userData.currencies.ton += 5;
            userData.currencies.gromd += 50;
            
            localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
        });

        this.showMessage('💰 Валюта добавлена всем тестерам!');
        this.render();
    }

    exportData() {
        const dataStr = JSON.stringify(this.usersData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pet-game-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showMessage('📤 Данные экспортированы!');
    }

    isUserSuspicious(userData) {
        // Проверка на подозрительную активность
        if (!userData.logs) return false;

        const recentActions = userData.logs.filter(log => 
            Date.now() - log.timestamp < 24 * 60 * 60 * 1000 // 24 часа
        ).length;

        return recentActions > 1000 || 
               (userData.currencies?.gromd || 0) > 10000 ||
               (userData.currencies?.grain || 0) > 100000;
    }

    showMessage(text) {
        this.tg.showPopup({
            title: '⚙️ Админ-панель',
            message: text,
            buttons: [{ type: 'ok' }]
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});