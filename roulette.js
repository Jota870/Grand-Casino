const roulette = {
    bets: {}, // { "red": 50, "12": 10 }
    totalBet: 0,
    isPlaying: false,

    init() {
        this.renderBoard();
    },

    renderBoard() {
        const board = document.getElementById('roulette-board');
        if (!board) return;
        board.innerHTML = '';
        
        // Let's create a very simple board for standard European Roulette
        const numbersGrid = document.createElement('div');
        numbersGrid.className = 'numbers-grid';
        
        // Zero
        const zeroBtn = document.createElement('div');
        zeroBtn.className = 'roulette-spot green zero';
        zeroBtn.innerText = '0';
        zeroBtn.onclick = () => this.placeBet('0');
        board.appendChild(zeroBtn);

        const numsContainer = document.createElement('div');
        numsContainer.className = 'nums-container';

        // 1 to 36
        for(let i = 1; i <= 36; i++) {
            const numBtn = document.createElement('div');
            const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(i);
            numBtn.className = `roulette-spot ${isRed ? 'red' : 'black'}`;
            numBtn.innerText = i;
            numBtn.onclick = () => this.placeBet(i.toString());
            numsContainer.appendChild(numBtn);
        }
        board.appendChild(numsContainer);

        // Outside bets
        const outsideContainer = document.createElement('div');
        outsideContainer.className = 'outside-bets';
        
        const outsideOptions = [
            { id: 'red', label: 'Rojo', class: 'red' },
            { id: 'black', label: 'Negro', class: 'black' },
            { id: 'even', label: 'Par', class: '' },
            { id: 'odd', label: 'Impar', class: '' }
        ];

        outsideOptions.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = `roulette-spot ${opt.class} outside`;
            btn.innerText = opt.label;
            btn.onclick = () => this.placeBet(opt.id);
            outsideContainer.appendChild(btn);
        });
        
        board.appendChild(outsideContainer);
    },

    placeBet(spotId) {
        if(this.isPlaying) return;
        
        const betInput = document.getElementById('roulette-bet');
        const amount = parseInt(betInput.value);

        if (isNaN(amount) || amount <= 0 || amount > app.balance) {
            this.showMessage("Saldo insuficiente o apuesta inválida", "var(--accent-red)");
            return;
        }

        if(!this.bets[spotId]) this.bets[spotId] = 0;
        this.bets[spotId] += amount;
        this.totalBet += amount;
        
        app.updateBalance(-amount);
        this.updateUI();
        this.showMessage(`Apuesta añadida a ${spotId}`, "white");
    },

    clearBets() {
        if(this.isPlaying) return;
        if(this.totalBet > 0) {
            app.updateBalance(this.totalBet);
            this.bets = {};
            this.totalBet = 0;
            this.updateUI();
            this.showMessage("Apuestas limpiadas.", "white");
        }
    },

    updateUI() {
        document.getElementById('roulette-total-label').innerText = this.totalBet.toLocaleString();
    },

    spin() {
        if(this.isPlaying) return;
        if(this.totalBet === 0) {
            this.showMessage("Haz al menos una apuesta.", "var(--accent-red)");
            return;
        }

        this.isPlaying = true;
        this.showMessage("Girando...", "var(--primary-color)");
        
        const wheel = document.getElementById('roulette-wheel');
        wheel.classList.add('spinning');
        
        setTimeout(() => {
            const resultNum = Math.floor(Math.random() * 37); // 0 to 36
            wheel.classList.remove('spinning');
            wheel.innerText = resultNum;
            this.calculateWinnings(resultNum);
        }, 3000);
    },

    calculateWinnings(resultNum) {
        this.isPlaying = false;
        let wonCount = 0;
        
        const resultIsRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(resultNum);
        const resultIsEven = resultNum !== 0 && resultNum % 2 === 0;
        const resultIsOdd = resultNum !== 0 && resultNum % 2 !== 0;

        // Payout rules
        // Straight number: 35:1  (pays 36 total)
        // Red/Black, Even/Odd: 1:1 (pays 2 total)
        
        for (const [spot, amount] of Object.entries(this.bets)) {
            if (spot === resultNum.toString()) {
                wonCount += amount * 36;
            } else if (spot === 'red' && resultIsRed) {
                wonCount += amount * 2;
            } else if (spot === 'black' && !resultIsRed && resultNum !== 0) {
                wonCount += amount * 2;
            } else if (spot === 'even' && resultIsEven) {
                wonCount += amount * 2;
            } else if (spot === 'odd' && resultIsOdd) {
                wonCount += amount * 2;
            }
        }

        if (wonCount > 0) {
            app.updateBalance(wonCount);
            this.showMessage(`¡Guau! El número es ${resultNum}. Ganaste $${wonCount.toLocaleString()}`, "var(--accent-green)");
        } else {
            this.showMessage(`El número es ${resultNum}. Perdiste.`, "var(--accent-red)");
        }

        this.bets = {};
        this.totalBet = 0;
        this.updateUI();
    },

    showMessage(text, color) {
        const msgEl = document.getElementById('roulette-message');
        msgEl.innerText = text;
        msgEl.style.color = color || "white";
    },

    reset() {
        this.clearBets();
        document.getElementById('roulette-wheel').innerText = "0";
        this.showMessage("Haz tu apuesta en el tablero.", "white");
        this.renderBoard();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    roulette.renderBoard();
});
