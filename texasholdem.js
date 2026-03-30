const texasholdem = {
    suits: ['♠', '♥', '♦', '♣'],
    values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    deck: [],
    
    players: [], // Array of { id: number, name: string, cards: [], isActive: boolean, isHero: boolean, moneyInPot: 0, status: string }
    communityCards: [],
    
    state: 0, 
    ante: 0,
    pot: 0,
    currentBet: 0, // Highest bet on this street

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

    drawCard() { return this.deck.pop(); },

    deal() {
        if (this.state !== 0) return;

        const betInput = document.getElementById('texasholdem-bet');
        this.ante = parseInt(betInput.value);

        if (isNaN(this.ante) || this.ante <= 0 || this.ante > app.balance) {
            this.showMessage("Ante inválido o saldo insuficiente.", "var(--accent-red)");
            return;
        }

        app.updateBalance(-this.ante);
        
        this.buildDeck();
        this.shuffle();

        // Initialize players (Hero + 3 Bots)
        this.players = [
            { id: 0, name: "Tú (Hero)", cards: [this.drawCard(), this.drawCard()], isActive: true, isHero: true, moneyInPot: this.ante, status: "Llama (Call)" },
            { id: 1, name: "Bot Maverick", cards: [this.drawCard(), this.drawCard()], isActive: true, isHero: false, moneyInPot: this.ante, status: "Llama (Call)" },
            { id: 2, name: "Bot Daniel", cards: [this.drawCard(), this.drawCard()], isActive: true, isHero: false, moneyInPot: this.ante, status: "Llama (Call)" },
            { id: 3, name: "Bot Phil", cards: [this.drawCard(), this.drawCard()], isActive: true, isHero: false, moneyInPot: this.ante, status: "Llama (Call)" }
        ];

        this.pot = this.ante * 4; 
        this.currentBet = this.ante;
        this.communityCards = [];

        this.state = 1;
        
        document.getElementById('texasholdem-ante-area').classList.add('hidden');
        document.getElementById('texasholdem-action-area').classList.remove('hidden');

        this.updateUI();
        this.showMessage("Pre-Flop: ¡Todos ponen su Ante! ¿Pasas o Subes?", "white");
    },

    fold() {
        if (this.state === 0 || this.state === 5) return;
        this.players[0].isActive = false;
        this.players[0].status = "No Va (Fold)";
        this.showMessage("Te has retirado (Fold).", "var(--accent-red)");
        this.simulateBotsAndAdvance();
    },

    checkCall() {
        if (this.state === 0 || this.state === 5) return;
        let amountToCall = this.currentBet - this.players[0].moneyInPot;
        
        if (amountToCall > 0) {
            if(app.balance < amountToCall) {
                this.showMessage("Saldo insuficiente para igualar. Estás All-In.", "var(--accent-red)");
                amountToCall = app.balance;
            }
            app.updateBalance(-amountToCall);
            this.players[0].moneyInPot += amountToCall;
            this.pot += amountToCall;
            this.players[0].status = "Iguala (Call)";
        } else {
            this.players[0].status = "Pasa (Check)";
        }

        this.simulateBotsAndAdvance();
    },

    raise() {
        if (this.state === 0 || this.state === 5) return;
        let amountToCall = this.currentBet - this.players[0].moneyInPot;
        let raiseAmount = this.ante; // Fixed raise amount for simplicity
        let totalNeeded = amountToCall + raiseAmount;

        if (app.balance < totalNeeded) {
            this.showMessage("Saldo insuficiente para subir.", "var(--accent-red)");
            return;
        }

        app.updateBalance(-totalNeeded);
        this.players[0].moneyInPot += totalNeeded;
        this.pot += totalNeeded;
        this.currentBet += raiseAmount;
        this.players[0].status = "Sube (Raise)";

        this.simulateBotsAndAdvance();
    },

    simulateBotsAndAdvance() {
        // Bots make decisions
        this.players.forEach(bot => {
            if (!bot.isHero && bot.isActive) {
                // Determine if bot needs to call a raise
                let amountToCall = this.currentBet - bot.moneyInPot;
                
                // Simple AI logic:
                // 10% chance to fold if there is a bet, otherwise Call.
                // Rare 5% chance to raise if they feel lucky.
                let decisionRand = Math.random();

                if (amountToCall > 0 && decisionRand < 0.15) {
                    // Fold
                    bot.isActive = false;
                    bot.status = "No Va (Fold)";
                } else if (amountToCall === 0 && decisionRand < 0.1) {
                    // Raise
                    let raiseAmount = this.ante;
                    bot.moneyInPot += raiseAmount;
                    this.pot += raiseAmount;
                    this.currentBet += raiseAmount;
                    bot.status = "Sube (Raise)";
                } else {
                    // Call / Check
                    if (amountToCall > 0) {
                        bot.moneyInPot += amountToCall;
                        this.pot += amountToCall;
                        bot.status = "Iguala (Call)";
                    } else {
                        bot.status = "Pasa (Check)";
                    }
                }
            }
        });

        // Check if everyone but 1 folded
        let activePlayers = this.players.filter(p => p.isActive);
        if (activePlayers.length === 1) {
            this.state = 5;
            this.earlyWinner(activePlayers[0]);
            return;
        }

        this.updateUI();
        
        setTimeout(() => {
            this.advanceState();
        }, 800);
    },

    advanceState() {
        this.state++;
        
        // Reset street money and status
        this.currentBet = 0;
        this.players.forEach(p => { 
            p.moneyInPot = 0; 
            if(p.isActive && p.status !== "No Va (Fold)") p.status = "Esperando...";
        });
        
        if (this.state === 2) {
            this.communityCards.push(this.drawCard(), this.drawCard(), this.drawCard());
            this.showMessage("Flop repartido. Acción.", "white");
        } else if (this.state === 3) {
            this.communityCards.push(this.drawCard());
            this.showMessage("Turn repartido. Acción.", "white");
        } else if (this.state === 4) {
            this.communityCards.push(this.drawCard());
            document.getElementById('texasholdem-call-btn').innerText = "Ver Cartas (Showdown)";
            this.showMessage("River repartido. Última acción.", "white");
        } else if (this.state > 4) {
            this.state = 5;
            this.showdown();
            return;
        }

        // If hero is already folded, auto-fast-forward
        if (!this.players[0].isActive) {
            setTimeout(() => this.simulateBotsAndAdvance(), 1000);
        } else {
            this.updateUI();
        }
    },

    earlyWinner(winner) {
        this.updateUI(true);
        let msg = `${winner.name} gana $${this.pot} (Los demás se retiraron).`;
        this.showMessage(msg, winner.isHero ? "var(--accent-green)" : "var(--accent-red)");
        if (winner.isHero) app.updateBalance(this.pot);
        this.endHand();
    },

    showdown() {
        this.updateUI(true); 
        
        let activePlayers = this.players.filter(p => p.isActive);
        let bestScore = -1;
        let winners = [];

        activePlayers.forEach(p => {
            let evalRes = this.evaluate7(p.cards.concat(this.communityCards));
            p.finalHandStr = evalRes.handName;
            p.finalScore = evalRes.score;
            
            if (p.finalScore > bestScore) {
                bestScore = p.finalScore;
                winners = [p];
            } else if (p.finalScore === bestScore) {
                winners.push(p);
            }
        });

        let winAmount = Math.floor(this.pot / winners.length);
        let names = winners.map(w => w.name).join(", ");
        
        let msg = `Gana: ${names} (${winners[0].finalHandStr}) con Bote de $${winAmount}!`;
        
        let heroWon = winners.some(w => w.isHero);
        if (heroWon) {
            app.updateBalance(winAmount);
            this.showMessage(msg, "var(--accent-green)");
        } else {
            this.showMessage(msg, "var(--accent-red)");
        }
        
        this.endHand();
    },

    endHand() {
        this.state = 0;
        document.getElementById('texasholdem-ante-area').classList.remove('hidden');
        document.getElementById('texasholdem-action-area').classList.add('hidden');
        document.getElementById('texasholdem-call-btn').innerText = "Pasar / Igualar";
    },

    updateUI(revealBots = false) {
        document.getElementById('texasholdem-pot').innerText = this.pot.toLocaleString();

        const commCardsDiv = document.getElementById('texasholdem-community-cards');
        commCardsDiv.innerHTML = '';
        this.communityCards.forEach(card => commCardsDiv.appendChild(this.createCardElement(card)));

        const oppDiv = document.getElementById('texasholdem-opponents');
        oppDiv.innerHTML = '';
        const heroDiv = document.getElementById('texasholdem-hero');
        heroDiv.innerHTML = '';

        this.players.forEach(p => {
            const wrap = document.createElement('div');
            wrap.className = 'texasholdem-player-box';
            if (!p.isActive) wrap.style.opacity = '0.5';

            const nameEl = document.createElement('div');
            nameEl.style.fontWeight = 'bold';
            nameEl.style.marginBottom = '5px';
            nameEl.innerText = `${p.name} - ${p.status}`;
            
            const cardsCont = document.createElement('div');
            cardsCont.className = 'cards-container poker-cards mini-cards';
            
            if (p.isHero || revealBots || !p.isActive) {
                p.cards.forEach(card => cardsCont.appendChild(this.createCardElement(card)));
            } else {
                for(let i=0; i<2; i++){
                    const hiddenCard = document.createElement('div');
                    hiddenCard.className = 'card hidden-card';
                    cardsCont.appendChild(hiddenCard);
                }
            }

            // Show final hand str if showdown
            if(revealBots && p.isActive && p.finalHandStr) {
                const handSub = document.createElement('div');
                handSub.style.fontSize = '0.8rem';
                handSub.style.color = 'var(--primary-color)';
                handSub.innerText = p.finalHandStr;
                wrap.appendChild(nameEl);
                wrap.appendChild(cardsCont);
                wrap.appendChild(handSub);
            } else {
                wrap.appendChild(nameEl);
                wrap.appendChild(cardsCont);
            }

            if (p.isHero) {
                heroDiv.appendChild(wrap);
            } else {
                oppDiv.appendChild(wrap);
            }
        });
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
        const msgEl = document.getElementById('texasholdem-message');
        if(msgEl) {
            msgEl.innerText = text;
            msgEl.style.color = color || "white";
        }
    },

    reset() {
        if(this.state !== 0) return;
        this.players = [];
        this.communityCards = [];
        this.pot = 0;
        document.getElementById('texasholdem-pot').innerText = '0';
        document.getElementById('texasholdem-opponents').innerHTML = '';
        document.getElementById('texasholdem-hero').innerHTML = '';
        document.getElementById('texasholdem-community-cards').innerHTML = '';
        this.showMessage("Haz tu Ante (apuesta inicial) para sentar a los jugadores en la mesa.", "white");
        document.getElementById('texasholdem-ante-area').classList.remove('hidden');
        document.getElementById('texasholdem-action-area').classList.add('hidden');
    },

    evaluate7(cards7) {
        if (cards7.length < 5) return { score: 0, handName: "No Hand" };
        let best = { score: -1, handName: "" };
        const getCombinations = (array, size) => {
            const result = [];
            const helper = (start, combo) => {
                if (combo.length === size) { result.push([...combo]); return; }
                for (let i = start; i < array.length; i++) {
                    combo.push(array[i]);
                    helper(i + 1, combo);
                    combo.pop();
                }
            };
            helper(0, []);
            return result;
        };

        const combos = getCombinations(cards7, 5);
        for (let hand5 of combos) {
            let res = this.evaluateHand5(hand5);
            if (res.score > best.score) best = res;
        }
        return best;
    },

    evaluateHand5(cards) {
        let weights = cards.map(c => c.weight).sort((a,b) => b-a);
        let isFlush = cards.every(c => c.suit === cards[0].suit);
        
        let isStraight = false;
        if (weights[0] - weights[4] === 4 && new Set(weights).size === 5) {
            isStraight = true;
        } else if (weights.join(',') === "14,5,4,3,2") {
            isStraight = true;
            weights = [5,4,3,2,1]; 
        }

        let counts = {};
        weights.forEach(w => counts[w] = (counts[w] || 0) + 1);
        
        let pairs = [], trips = [], quads = [];
        for (let w in counts) {
            if (counts[w] === 2) pairs.push(parseInt(w));
            if (counts[w] === 3) trips.push(parseInt(w));
            if (counts[w] === 4) quads.push(parseInt(w));
        }
        pairs.sort((a,b) => b-a);
        trips.sort((a,b) => b-a);

        let score = 0;
        let handName = "";

        if (isFlush && isStraight) {
            score = 8000000 + weights[0];
            handName = weights[0] === 14 ? "Royal Flush" : "Straight Flush";
        } else if (quads.length === 1) {
            score = 7000000 + quads[0]*100;
            handName = "Poker (4 of a kind)";
        } else if (trips.length === 1 && pairs.length >= 1) {
            score = 6000000 + trips[0]*100 + pairs[0];
            handName = "Full House";
        } else if (isFlush) {
            score = 5000000 + weights[0]*10000 + weights[1]*1000 + weights[2]*100 + weights[3]*10 + weights[4];
            handName = "Color (Flush)";
        } else if (isStraight) {
            score = 4000000 + weights[0];
            handName = "Escalera (Straight)";
        } else if (trips.length === 1) {
            score = 3000000 + trips[0]*10000;
            handName = "Trío (3 of a kind)";
        } else if (pairs.length >= 2) {
            score = 2000000 + pairs[0]*10000 + pairs[1]*100;
            handName = "Doble Pareja";
        } else if (pairs.length === 1) {
            score = 1000000 + pairs[0]*100000;
            handName = "Pareja";
        } else {
            score = weights[0]*10000 + weights[1]*1000 + weights[2]*100 + weights[3]*10 + weights[4];
            handName = "Carta Alta";
        }
        return { score, handName };
    }
};
