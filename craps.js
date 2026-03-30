const craps = {
    point: null,
    isPlaying: false,
    bet: 0,

    roll() {
        const betInput = document.getElementById('craps-bet');
        
        if (!this.isPlaying) {
            // New round (Come Out)
            this.bet = parseInt(betInput.value);
            if (isNaN(this.bet) || this.bet <= 0 || this.bet > app.balance) {
                this.showMessage("Apuesta inválida o saldo insuficiente", "var(--accent-red)");
                return;
            }
            app.updateBalance(-this.bet);
            this.isPlaying = true;
            betInput.disabled = true;
        }

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;

        this.animateDice(d1, d2, total);
    },

    animateDice(d1, d2, total) {
        document.getElementById('craps-roll-btn').disabled = true;
        const die1UI = document.getElementById('die1');
        const die2UI = document.getElementById('die2');
        
        die1UI.classList.add('rolling');
        die2UI.classList.add('rolling');

        this.showMessage("Tirando dados...", "var(--primary-color)");

        setTimeout(() => {
            die1UI.classList.remove('rolling');
            die2UI.classList.remove('rolling');
            
            // Unicode dice faces: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅
            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            die1UI.innerText = faces[d1 - 1];
            die2UI.innerText = faces[d2 - 1];

            this.evaluateRoll(total);
        }, 1000);
    },

    evaluateRoll(total) {
        document.getElementById('craps-roll-btn').disabled = false;

        if (this.point === null) {
            // Come Out Roll
            if (total === 7 || total === 11) {
                this.win(`¡El tirador saca ${total}! ¡Ganas en la línea de pase (Pass Line)!`);
            } else if (total === 2 || total === 3 || total === 12) {
                this.lose(`¡Craps! El tirador saca ${total}. Pierdes.`);
            } else {
                this.point = total;
                document.getElementById('craps-point').innerText = this.point;
                document.getElementById('craps-point').style.color = "white";
                this.showMessage(`El Punto (Point) es ${this.point}. Vuelve a tirar.`, "white");
                document.getElementById('craps-roll-btn').innerText = "Tirar Dados";
            }
        } else {
            // Point Roll
            if (total === this.point) {
                this.win(`¡El tirador logró el Punto (${total})! ¡GANAS!`);
            } else if (total === 7) {
                this.lose(`¡Siete (Seven Out)! Pierdes la línea de pase.`);
            } else {
                this.showMessage(`Sacaste ${total}. El punto es ${this.point}. Vuelve a tirar.`, "white");
            }
        }
    },

    win(msg) {
        app.updateBalance(this.bet * 2); // Pass Line pays 1:1, so getting bet+win back is bet*2
        this.showMessage(msg, "var(--accent-green)");
        this.endHand();
    },

    lose(msg) {
        this.showMessage(msg, "var(--accent-red)");
        this.endHand();
    },

    endHand() {
        this.isPlaying = false;
        this.point = null;
        this.bet = 0;
        document.getElementById('craps-bet').disabled = false;
        document.getElementById('craps-point').innerText = "Off";
        document.getElementById('craps-point').style.color = "var(--primary-color)";
        document.getElementById('craps-roll-btn').innerText = "Apostar y Tirar Dados";
    },

    showMessage(text, color) {
        const msgEl = document.getElementById('craps-message');
        if(msgEl) {
            msgEl.innerText = text;
            msgEl.style.color = color || "white";
        }
    },

    reset() {
        if(!this.isPlaying) {
            this.endHand();
            this.showMessage("Haz una apuesta a Pass Line y tira.", "white");
            document.getElementById('die1').innerText = "⚀";
            document.getElementById('die2').innerText = "⚀";
        }
    }
};
