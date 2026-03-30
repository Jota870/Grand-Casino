const blackjack = {
    suits: ['♠', '♥', '♦', '♣'],
    values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    deck: [],
    
    // Split support
    playerHands: [], // Array of { cards: [], bet: number, status: string, isDoubled: false }
    currentHandIndex: 0,
    dealerHand: [],
    
    isPlaying: false,
    insuranceBet: 0,

    buildDeck() {
        this.deck = [];
        // Use 4 decks for casino realistic feel
        for (let d = 0; d < 4; d++) {
            for (let s of this.suits) {
                for (let v of this.values) {
                    this.deck.push({ 
                        suit: s, 
                        value: v, 
                        weight: this.getWeight(v),
                        isRed: s === '♥' || s === '♦'
                    });
                }
            }
        }
    },

    getWeight(value) {
        if (['J', 'Q', 'K'].includes(value)) return 10;
        if (value === 'A') return 11;
        return parseInt(value);
    },

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    drawCard() {
        if (this.deck.length < 10) {
            this.buildDeck();
            this.shuffle();
        }
        return this.deck.pop();
    },

    deal() {
        if (this.isPlaying) return;

        const betInput = document.getElementById('bj-bet');
        const initialBet = parseInt(betInput.value);

        if (isNaN(initialBet) || initialBet <= 0 || initialBet > app.balance) {
            this.showMessage("Apuesta inválida o saldo insuficiente", "red");
            return;
        }

        app.updateBalance(-initialBet);
        this.isPlaying = true;
        this.insuranceBet = 0;
        
        document.getElementById('bj-bet-area').classList.add('hidden');
        document.getElementById('bj-action-area').classList.remove('hidden');
        
        this.buildDeck();
        this.shuffle();

        this.playerHands = [{
            cards: [this.drawCard(), this.drawCard()],
            bet: initialBet,
            status: 'playing',
            isDoubled: false
        }];
        this.currentHandIndex = 0;
        
        this.dealerHand = [this.drawCard(), this.drawCard()];

        this.updateUI();
        this.checkInitialState();
    },

    calculateScore(hand) {
        let score = 0;
        let aces = 0;
        
        for (let card of hand) {
            score += card.weight;
            if (card.value === 'A') aces++;
        }
        
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        
        return score;
    },

    checkInitialState() {
        const hand = this.playerHands[0];
        const pScore = this.calculateScore(hand.cards);
        const dScore = this.calculateScore(this.dealerHand);
        
        // Insurance
        if (this.dealerHand[0].value === 'A' && app.balance >= hand.bet / 2) {
            if (confirm("El crupier tiene un As. ¿Deseas comprar seguro por $" + (hand.bet/2) + "?")) {
                this.insuranceBet = hand.bet / 2;
                app.updateBalance(-this.insuranceBet);
                this.showMessage("Seguro comprado. Comprobando Blackjack del crupier...", "white");
            }
        }

        // Dealer check for blackjack immediately if they have 10 or A showing
        if (['10', 'J', 'Q', 'K', 'A'].includes(this.dealerHand[0].value)) {
            if (dScore === 21) {
                this.isPlaying = false;
                this.updateUI(true);
                let msg = "El crupier tiene Blackjack.";
                
                // Payout insurance if bought
                if (this.insuranceBet > 0) {
                    app.updateBalance(this.insuranceBet * 3); // 2:1 payout + original bet returned conceptually
                    msg += " ¡Seguro pagado!";
                }

                if (pScore === 21) {
                    hand.status = 'push';
                    msg += " Push (Empate).";
                } else {
                    hand.status = 'lost';
                }
                
                this.resolveHands(msg);
                return;
            } else if (this.insuranceBet > 0) {
                this.showMessage("Nadie tiene Blackjack. Perdiste el seguro.", "red");
                this.insuranceBet = 0;
            }
        }

        if (pScore === 21) { // Player Blackjack
            this.isPlaying = false;
            this.updateUI(true);
            hand.status = 'blackjack';
            this.resolveHands("¡BLACKJACK! Ganaste 3:2.");
        } else {
            this.showMessage("Mano " + (this.currentHandIndex + 1) + ": Tu turno.", "white");
            this.checkExtraOptions();
        }
    },

    checkExtraOptions() {
        if (!this.isPlaying) return;

        const hand = this.playerHands[this.currentHandIndex];
        const doubleBtn = document.getElementById('bj-double-btn');
        const splitBtn = document.getElementById('bj-split-btn');
        
        // Double Down only on initial 2 cards
        if (hand.cards.length === 2 && app.balance >= hand.bet) {
            doubleBtn.style.display = 'inline-block';
        } else {
            doubleBtn.style.display = 'none';
        }

        // Split only on 2 cards of same value
        if (hand.cards.length === 2 && hand.cards[0].value === hand.cards[1].value && app.balance >= hand.bet) {
            splitBtn.style.display = 'inline-block';
        } else {
            splitBtn.style.display = 'none';
        }
    },

    hit() {
        if (!this.isPlaying) return;
        
        document.getElementById('bj-double-btn').style.display = 'none';
        document.getElementById('bj-split-btn').style.display = 'none';
        
        const hand = this.playerHands[this.currentHandIndex];
        hand.cards.push(this.drawCard());
        this.updateUI();
        
        const pScore = this.calculateScore(hand.cards);
        if (pScore > 21) {
            hand.status = 'busted';
            this.nextHand();
        } else if (pScore === 21) {
            this.stand();
        }
    },

    doubleDown() {
        if (!this.isPlaying) return;
        const hand = this.playerHands[this.currentHandIndex];
        if (hand.cards.length !== 2 || app.balance < hand.bet) return;

        app.updateBalance(-hand.bet);
        hand.bet *= 2;
        hand.isDoubled = true;

        hand.cards.push(this.drawCard());
        this.updateUI();

        const pScore = this.calculateScore(hand.cards);
        if (pScore > 21) {
            hand.status = 'busted';
        } else {
            hand.status = 'stood';
        }
        this.nextHand();
    },

    split() {
        if (!this.isPlaying) return;
        const hand = this.playerHands[this.currentHandIndex];
        if (hand.cards.length !== 2 || hand.cards[0].value !== hand.cards[1].value || app.balance < hand.bet) return;

        app.updateBalance(-hand.bet);

        // Create new hand
        const newHand = {
            cards: [hand.cards.pop(), this.drawCard()],
            bet: hand.bet,
            status: 'playing',
            isDoubled: false
        };

        // Update current hand
        hand.cards.push(this.drawCard());

        this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);
        
        this.updateUI();
        this.showMessage("Mano dividida. Jugando mano " + (this.currentHandIndex + 1), "white");
        this.checkExtraOptions();
        
        // Auto-resolve if split Aces
        if (hand.cards[0].value === 'A') {
            this.stand(); // Standard casino rules: Split aces get exactly 1 card.
        }
    },

    stand() {
        if (!this.isPlaying) return;
        this.playerHands[this.currentHandIndex].status = 'stood';
        this.nextHand();
    },

    nextHand() {
        this.currentHandIndex++;
        if (this.currentHandIndex < this.playerHands.length) {
            this.showMessage("Mano " + (this.currentHandIndex + 1) + ": Tu turno.", "white");
            this.updateUI();
            this.checkExtraOptions();
        } else {
            this.dealerPlay();
        }
    },

    dealerPlay() {
        this.isPlaying = false;
        
        // Check if all hands are busted or blackjacks
        const allDone = this.playerHands.every(h => h.status === 'busted' || h.status === 'blackjack');
        
        if (allDone) {
            this.updateUI(true);
            this.resolveHands("Fin del juego.");
            return;
        }

        const dealerTurn = () => {
            let dScore = this.calculateScore(this.dealerHand);
            if (dScore < 17) {
                this.dealerHand.push(this.drawCard());
                this.updateUI(true);
                setTimeout(dealerTurn, 800);
            } else {
                this.resolveHands("El crupier se detiene con " + dScore);
            }
        };
        
        this.updateUI(true);
        setTimeout(dealerTurn, 800);
    },

    resolveHands(headerMsg) {
        const dScore = this.calculateScore(this.dealerHand);
        const dealerBusted = dScore > 21;
        
        let totalWinnings = 0;

        for (let i = 0; i < this.playerHands.length; i++) {
            const hand = this.playerHands[i];
            
            if (hand.status === 'busted') {
                // Already lost
            } else if (hand.status === 'blackjack') {
                totalWinnings += hand.bet * 2.5; // 3:2 payout (return bet + 1.5x)
            } else if (hand.status === 'push') {
                totalWinnings += hand.bet;
            } else {
                const pScore = this.calculateScore(hand.cards);
                if (dealerBusted || pScore > dScore) {
                    hand.status = 'won';
                    totalWinnings += hand.bet * 2;
                } else if (pScore === dScore) {
                    hand.status = 'push';
                    totalWinnings += hand.bet;
                } else {
                    hand.status = 'lost';
                }
            }
        }

        if (totalWinnings > 0) {
            app.updateBalance(totalWinnings);
            this.showMessage(headerMsg + ` ¡Felicitaciones! Recibes $${totalWinnings}`, "var(--accent-green)");
        } else {
            this.showMessage(headerMsg + " No hay ganancias en esta ronda.", "var(--accent-red)");
        }

        document.getElementById('bj-bet-area').classList.remove('hidden');
        document.getElementById('bj-action-area').classList.add('hidden');
    },

    updateUI(revealDealer = false) {
        const pCardsDiv = document.getElementById('player-cards');
        pCardsDiv.innerHTML = '';
        
        // Display all hands
        this.playerHands.forEach((hand, index) => {
            const handWrapper = document.createElement('div');
            handWrapper.style.margin = "10px 0";
            handWrapper.style.padding = "10px";
            handWrapper.style.border = index === this.currentHandIndex && this.isPlaying ? "2px solid var(--primary-color)" : "1px solid transparent";
            handWrapper.style.borderRadius = "10px";
            
            const title = document.createElement('div');
            title.innerText = `Mano ${index + 1} - Apuesta: $${hand.bet} - Puntos: ` + this.calculateScore(hand.cards);
            handWrapper.appendChild(title);

            const cardsRow = document.createElement('div');
            cardsRow.className = 'cards-container';
            hand.cards.forEach(card => cardsRow.appendChild(this.createCardElement(card)));
            handWrapper.appendChild(cardsRow);

            pCardsDiv.appendChild(handWrapper);
        });

        const dCardsDiv = document.getElementById('dealer-cards');
        dCardsDiv.innerHTML = '';
        
        if (!revealDealer && this.dealerHand.length > 0) {
            dCardsDiv.appendChild(this.createCardElement(this.dealerHand[0]));
            const hiddenCard = document.createElement('div');
            hiddenCard.className = 'card hidden-card';
            dCardsDiv.appendChild(hiddenCard);
            
            document.getElementById('dealer-score').innerText = this.getWeight(this.dealerHand[0].value);
        } else {
            this.dealerHand.forEach(card => dCardsDiv.appendChild(this.createCardElement(card)));
            document.getElementById('dealer-score').innerText = this.calculateScore(this.dealerHand);
        }
    },

    createCardElement(card) {
        const div = document.createElement('div');
        div.className = `card ${card.isRed ? 'red' : ''}`;
        
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
        
        return div;
    },

    showMessage(text, color) {
        const msgEl = document.getElementById('bj-message');
        msgEl.innerText = text;
        msgEl.style.color = color || "white";
    },
    
    reset() {
        if(this.isPlaying) return; 
        this.playerHands = [];
        this.currentHandIndex = 0;
        this.dealerHand = [];
        document.getElementById('player-cards').innerHTML = '';
        document.getElementById('dealer-cards').innerHTML = '';
        document.getElementById('dealer-score').innerText = '0';
        this.showMessage("Haz tu apuesta para empezar", "white");
        document.getElementById('bj-bet-area').classList.remove('hidden');
        document.getElementById('bj-action-area').classList.add('hidden');
    }
};
