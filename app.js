const app = {
    balance: 5000,
    
    init() {
        this.loadBalance();
        this.updateBalanceUI();
        console.log("Casino Initialized");
    },
    
    loadBalance() {
        const saved = localStorage.getItem('casinoBalance');
        if (saved !== null) {
            this.balance = parseInt(saved);
        } else {
            this.balance = 5000; // Saldo inicial por defecto
            this.saveBalance();
        }
    },
    
    saveBalance() {
        localStorage.setItem('casinoBalance', this.balance);
    },
    
    updateBalance(amount) {
        this.balance += amount;
        if (this.balance < 0) this.balance = 0;
        this.saveBalance();
        this.updateBalanceUI();
    },
    
    updateBalanceUI() {
        document.getElementById('user-balance').innerText = this.balance.toLocaleString();
    },
    
    openGame(gameId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(gameId + '-game').classList.add('active');
        
        // Reset specific game state
        if(gameId === 'blackjack' && typeof blackjack !== 'undefined') blackjack.reset();
        if(gameId === 'slots' && typeof slots !== 'undefined') slots.reset();
        if(gameId === 'roulette' && typeof roulette !== 'undefined') roulette.reset();
        if(gameId === 'sports' && typeof sports !== 'undefined') sports.init();
        if(gameId === 'poker' && typeof texasholdem !== 'undefined') texasholdem.reset();
        if(gameId === 'videopoker' && typeof videopoker !== 'undefined') videopoker.reset();
        if(gameId === 'craps' && typeof craps !== 'undefined') craps.reset();
    },
    
    showLobby() {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('lobby').classList.add('active');
    },

    openCashier() {
        document.getElementById('cashier-modal').classList.add('active');
        document.getElementById('cashier-balance').innerText = this.balance.toLocaleString();
        document.getElementById('cashier-message').innerText = "";
        document.getElementById('cashier-amount').value = "";
    },
    
    closeCashier() {
        document.getElementById('cashier-modal').classList.remove('active');
    },

    processTransaction(type) {
        const input = document.getElementById('cashier-amount');
        const amount = parseInt(input.value);
        const msgEl = document.getElementById('cashier-message');
        
        if (isNaN(amount) || amount <= 0) {
            msgEl.innerText = "Por favor, ingresa una cantidad válida.";
            msgEl.style.color = "var(--accent-red)";
            return;
        }

        if (type === 'withdraw' && amount > this.balance) {
            msgEl.innerText = "Fondos insuficientes para retirar esa cantidad.";
            msgEl.style.color = "var(--accent-red)";
            return;
        }

        if (type === 'deposit') {
            this.updateBalance(amount);
            msgEl.innerText = `Has depositado $${amount.toLocaleString()} exitosamente.`;
            msgEl.style.color = "var(--accent-green)";
        } else if (type === 'withdraw') {
            this.updateBalance(-amount);
            msgEl.innerText = `Has retirado $${amount.toLocaleString()} exitosamente.`;
            msgEl.style.color = "var(--accent-green)";
        }
        
        input.value = "";
        document.getElementById('cashier-balance').innerText = this.balance.toLocaleString();
    }
};

window.onload = () => app.init();
