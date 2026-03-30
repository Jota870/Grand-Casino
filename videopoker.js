const videopoker = {
    suits: ['♠', '♥', '♦', '♣'],
    values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    deck: [],
    hand: [],
    held: [false, false, false, false, false],
    state: 0, // 0 = ready to deal, 1 = ready to draw
    bet: 0,

    buildDeck() {
        this.deck = [];
        for (let s of this.suits) {
            for (let v of this.values) {
                this.deck.push({ 
                    suit: s, value: v, weight: this.getWeight(v), isRed: s === '♥' || s === '♦'
                });
            }
        }
    },

    getWeight(value) {
        if (value === 'A') return 14;
        if (['J', 'Q', 'K'].includes(value)) return value === 'J' ? 11 : value === 'Q' ? 12 : 13;
        return parseInt(value);
    },

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    deal() {
        if (this.state === 0) {
            const betInput = document.getElementById('vpoker-bet');
            this.bet = parseInt(betInput.value);

            if (isNaN(this.bet) || this.bet <= 0 || this.bet > app.balance) {
                this.showMessage("Apuesta inválida o saldo insuficiente", "var(--accent-red)");
                return;
            }

            app.updateBalance(-this.bet);
            this.buildDeck();
            this.shuffle();

            this.hand = [];
            this.held = [false, false, false, false, false];
            
            for(let i=0; i<5; i++) {
                this.hand.push(this.deck.pop());
            }

            this.state = 1;
            document.getElementById('vp-deal-btn').innerText = "Dibujar (Draw)";
            this.showMessage("Haz clic en las cartas que deseas mantener (Hold)", "white");
            this.renderCards();
            
        } else if (this.state === 1) {
            for(let i=0; i<5; i++) {
                if (!this.held[i]) {
                    this.hand[i] = this.deck.pop();
                }
            }
            
            this.state = 0;
            document.getElementById('vp-deal-btn').innerText = "Repartir (Nueva Mano)";
            this.renderCards(true);
            this.evaluateHand();
        }
    },

    toggleHold(index) {
        if (this.state !== 1) return;
        this.held[index] = !this.held[index];
        this.renderCards();
    },

    renderCards(final = false) {
        const container = document.getElementById('poker-cards');
        if(!container) return;
        container.innerHTML = '';

        this.hand.forEach((card, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '10px';

            const div = document.createElement('div');
            div.className = `card ${card.isRed ? 'red' : ''}`;
            div.style.cursor = this.state === 1 ? 'pointer' : 'default';
            div.style.transform = this.held[index] && !final ? 'translateY(-10px)' : 'none';
            div.style.transition = 'transform 0.2s';
            if(this.state === 1) {
                div.onclick = () => this.toggleHold(index);
            }
            
            const top = document.createElement('div');
            top.innerText = `${card.value} ${card.suit}`;
            const center = document.createElement('div');
            center.style.fontSize = '2rem';
            center.style.textAlign = 'center';
            center.innerText = card.suit;
            const bottom = document.createElement('div');
            bottom.innerText = `${card.value} ${card.suit}`;
            bottom.style.transform = 'rotate(180deg)';
            
            div.appendChild(top);
            div.appendChild(center);
            div.appendChild(bottom);

            wrapper.appendChild(div);

            const holdLabel = document.createElement('div');
            holdLabel.innerText = this.held[index] && !final ? "HELD" : "";
            holdLabel.style.fontWeight = "bold";
            holdLabel.style.color = "var(--primary-color)";
            holdLabel.style.height = "20px";
            wrapper.appendChild(holdLabel);

            container.appendChild(wrapper);
        });
    },

    evaluateHand() {
        const handWeights = this.hand.map(c => c.weight).sort((a,b) => a-b);
        const suits = this.hand.map(c => c.suit);
        
        const counts = {};
        handWeights.forEach(w => counts[w] = (counts[w] || 0) + 1);
        const pairs = Object.values(counts).filter(c => c === 2);
        const threes = Object.values(counts).filter(c => c === 3);
        const fours = Object.values(counts).filter(c => c === 4);
        
        let multiplier = 0;
        let msg = "Nada. Fin del juego.";

        const isFlush = suits.every(s => s === suits[0]);
        let isStraight = false;
        if(handWeights[4] - handWeights[0] === 4 && new Set(handWeights).size === 5) {
            isStraight = true;
        } else if (handWeights.join(',') === "2,3,4,5,14") {
            isStraight = true;
        }

        const hasJacksOrBetter = Object.keys(counts).some(w => counts[w] === 2 && parseInt(w) >= 11);

        if (isFlush && isStraight && handWeights[4] === 14 && handWeights[0] === 10) {
            multiplier = 800; msg = "¡ROYAL FLUSH!";
        } else if (isFlush && isStraight) {
            multiplier = 50; msg = "¡STRAIGHT FLUSH!";
        } else if (fours.length === 1) {
            multiplier = 25; msg = "¡POKER (4 OF A KIND)!";
        } else if (threes.length === 1 && pairs.length === 1) {
            multiplier = 9; msg = "¡FULL HOUSE!";
        } else if (isFlush) {
            multiplier = 6; msg = "¡COLOR (FLUSH)!";
        } else if (isStraight) {
            multiplier = 4; msg = "¡ESCALERA (STRAIGHT)!";
        } else if (threes.length === 1) {
            multiplier = 3; msg = "¡TRÍO (3 OF A KIND)!";
        } else if (pairs.length === 2) {
            multiplier = 2; msg = "¡DOBLE PAREJA (2 PAIRS)!";
        } else if (hasJacksOrBetter) {
            multiplier = 1; msg = "¡JOTAS O MEJOR (JACKS OR BETTER)!";
        }
        
        if (multiplier > 0) {
            const won = this.bet * multiplier;
            app.updateBalance(won);
            this.showMessage(`${msg} Ganaste $${won.toLocaleString()}`, "var(--accent-green)");
        } else {
            this.showMessage(msg, "var(--accent-red)");
        }
    },

    showMessage(text, color) {
        const msgEl = document.getElementById('vp-message');
        if(msgEl) {
            msgEl.innerText = text;
            msgEl.style.color = color || "white";
        }
    },

    reset() {
        this.hand = [];
        this.state = 0;
        document.getElementById('poker-cards').innerHTML = '';
        document.getElementById('vp-deal-btn').innerText = "Repartir";
        this.showMessage("Haz tu apuesta y reparte", "white");
    }
};
