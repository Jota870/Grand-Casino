const slots = {
    symbols: ['🍒', '🍋', '🔔', '🍉', '🍇', '💎', '7️⃣'],
    isSpinning: false,
    
    spin() {
        if (this.isSpinning) return;
        
        const betInput = document.getElementById('slot-bet');
        const bet = parseInt(betInput.value);
        
        if (isNaN(bet) || bet <= 0 || bet > app.balance) {
            this.showMessage("Apuesta inválida o saldo insuficiente", "red");
            return;
        }

        app.updateBalance(-bet);
        this.isSpinning = true;
        this.showMessage("Girando...", "var(--primary-color)");
        
        const reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];

        // Add spinning animation
        reels.forEach(r => r.classList.add('spinning'));

        // Delay logic to simulate spinning
        setTimeout(() => {
            const results = [];
            reels.forEach((reel, index) => {
                setTimeout(() => {
                    const randomSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
                    reel.innerText = randomSymbol;
                    reel.classList.remove('spinning');
                    results.push(randomSymbol);
                    
                    if(index === 2) { // Last reel
                        this.checkWin(results, bet);
                    }
                }, index * 400); // Stop reels sequentially
            });
        }, 1200); // Spin for 1.2 second
    },

    checkWin(results, bet) {
        this.isSpinning = false;
        
        const isJackpot = results[0] === '7️⃣' && results[1] === '7️⃣' && results[2] === '7️⃣';
        const isThreeOfKind = results[0] === results[1] && results[1] === results[2];
        const isTwoOfKind = results[0] === results[1] || results[1] === results[2] || results[0] === results[2];
        const hasCherry = results.includes('🍒');

        let winAmount = 0;
        let msg = "";

        if (isJackpot) {
            winAmount = bet * 50;
            msg = `¡JACKPOT! Ganaste $${winAmount}`;
        } else if (isThreeOfKind) {
            winAmount = bet * 10;
            msg = `¡Tres iguales! Ganaste $${winAmount}`;
        } else if (isTwoOfKind) {
            winAmount = bet * 2;
            msg = `¡Dos iguales! Ganaste $${winAmount}`;
        } else if (hasCherry) {
            winAmount = bet * 1; 
            msg = `¡Cereza! Recuperas tus $${winAmount}`;
        } else {
            msg = "Sin suerte. ¡Intenta de nuevo!";
        }

        if (winAmount > 0) {
            app.updateBalance(winAmount);
            this.showMessage(msg, "var(--accent-green)");
        } else {
            this.showMessage(msg, "red");
        }
    },

    showMessage(text, color) {
        const msgEl = document.getElementById('slot-message');
        msgEl.innerText = text;
        msgEl.style.color = color || "var(--primary-color)";
    },
    
    reset() {
        this.showMessage("¡Haz tu apuesta y gira!", "var(--primary-color)");
    }
};
