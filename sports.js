const sports = {
    matches: [],
    selectedBets: [], // Array of { match: obj, outcome: string, odds: number }
    currentFilter: 'All',

    sportsData: {
        Fútbol: {
            "España": {
                "La Liga": ["Real Madrid", "Barcelona", "Atlético Madrid", "Sevilla", "Valencia", "Villarreal"],
                "Copa del Rey": ["Athletic Club", "Real Sociedad", "Betis", "Osasuna"]
            },
            "Inglaterra": {
                "Premier League": ["Manchester City", "Arsenal", "Liverpool", "Manchester United", "Chelsea", "Tottenham"],
                "FA Cup": ["Wigan Athletic", "Portsmouth", "Leicester City", "West Ham"]
            },
            "Italia": {
                "Serie A": ["Juventus", "AC Milan", "Inter Milán", "Napoli", "AS Roma", "Lazio"]
            },
            "Latinoamérica": {
                "Liga MX (México)": ["América", "Chivas", "Monterrey", "Tigres", "Cruz Azul", "Pumas UNAM"],
                "Primera División (Argentina)": ["Boca Juniors", "River Plate", "Racing Club", "Independiente", "San Lorenzo", "Vélez"],
                "Brasileirão (Brasil)": ["Flamengo", "Palmeiras", "São Paulo", "Corinthians"]
            },
            "Torneos Continentales": {
                "Champions League": ["PSG", "Bayern Munich", "Borussia Dortmund", "Benfica", "Porto", "Ajax"],
                "Copa Libertadores": ["Fluminense", "Boca Juniors", "River Plate", "Nacional"]
            }
        },
        Baloncesto: {
            "Estados Unidos": {
                "NBA": ["Los Angeles Lakers", "Golden State Warriors", "Boston Celtics", "Miami Heat", "Chicago Bulls", "Dallas Mavericks"]
            },
            "Torneos Continentales": {
                "EuroLeague": ["Real Madrid Baloncesto", "FC Barcelona Bàsquet", "Olympiacos", "Fenerbahçe", "CSKA Moscú", "Maccabi Tel Aviv"]
            }
        },
        Tenis: {
            "Torneos Mundiales": {
                "ATP Grand Slam": ["Carlos Alcaraz", "Novak Djokovic", "Jannik Sinner", "Daniil Medvedev", "Rafael Nadal", "Alexander Zverev"],
                "WTA Grand Slam": ["Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Elena Rybakina", "Jessica Pegula", "Ons Jabeur"]
            }
        },
        ESports: {
            "Torneos Mundiales": {
                "League of Legends (Worlds)": ["T1", "JD Gaming", "Gen.G", "Fnatic", "G2 Esports", "Cloud9"],
                "Counter Strike 2 (Major)": ["Team Vitality", "FaZe Clan", "Natus Vincere", "G2 Esports", "MOUZ", "ENCE"]
            }
        },
        "Deportes Americanos": {
            "Estados Unidos": {
                "NFL (Fútbol Americano)": ["Kansas City Chiefs", "San Francisco 49ers", "Baltimore Ravens", "Buffalo Bills", "Dallas Cowboys", "Philadelphia Eagles"],
                "MLB (Béisbol)": ["New York Yankees", "Los Angeles Dodgers", "Houston Astros", "Atlanta Braves", "Texas Rangers", "Philadelphia Phillies"]
            }
        }
    },

    init() {
        this.selectedBets = [];
        this.generateVastMatches();
        this.renderFilters();
        this.renderMatches();
        this.updateBetSlip();
    },

    generateVastMatches() {
        this.matches = [];
        let idCounter = 1;

        for (const [sport, countries] of Object.entries(this.sportsData)) {
            for (const [country, leagues] of Object.entries(countries)) {
                for (const [league, teams] of Object.entries(leagues)) {
                    let shuffledTeams = [...teams].sort(() => 0.5 - Math.random());
                    
                    for (let i = 0; i < Math.floor(shuffledTeams.length / 2); i++) {
                        const home = shuffledTeams[i * 2];
                        const away = shuffledTeams[i * 2 + 1];
                        
                        let homeOdds, drawOdds, awayOdds;

                        if (sport === "Tenis" || sport === "ESports" || league.includes("MLB") || league.includes("NFL")) {
                            homeOdds = (Math.random() * 2.0 + 1.1).toFixed(2);
                            drawOdds = null; 
                            awayOdds = (Math.random() * 2.0 + 1.1).toFixed(2);
                        } else if (sport === "Baloncesto") {
                            homeOdds = (Math.random() * 1.8 + 1.1).toFixed(2);
                            drawOdds = (Math.random() * 10 + 10).toFixed(2);
                            awayOdds = (Math.random() * 1.8 + 1.1).toFixed(2);
                        } else {
                            homeOdds = (Math.random() * 2.5 + 1.2).toFixed(2);
                            drawOdds = (Math.random() * 1.5 + 2.5).toFixed(2);
                            awayOdds = (Math.random() * 2.5 + 1.2).toFixed(2);
                        }

                        this.matches.push({
                            id: idCounter++,
                            sport: sport,
                            country: country,
                            league: league,
                            home: home,
                            away: away,
                            odds: {
                                home: homeOdds,
                                draw: drawOdds,
                                away: awayOdds
                            }
                        });
                    }
                }
            }
        }
    },

    setFilter(sport) {
        this.currentFilter = sport;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.innerText === sport || (sport === 'All' && btn.innerText === 'Todos')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderMatches();
    },

    renderFilters() {
        const filterContainer = document.getElementById('sports-filters');
        if (!filterContainer) return;

        filterContainer.innerHTML = '';
        
        const btnAll = document.createElement('button');
        btnAll.className = 'filter-btn active';
        btnAll.innerText = 'Todos';
        btnAll.onclick = () => this.setFilter('All');
        filterContainer.appendChild(btnAll);

        Object.keys(this.sportsData).forEach(sport => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.innerText = sport;
            btn.onclick = () => this.setFilter(sport);
            filterContainer.appendChild(btn);
        });
    },

    renderMatches() {
        const list = document.getElementById('matches-list');
        if (!list) return;
        list.innerHTML = '';

        let filteredMatches = this.matches;
        if (this.currentFilter !== 'All') {
            filteredMatches = this.matches.filter(m => m.sport === this.currentFilter);
        }

        const matchesHierarchy = {};
        
        filteredMatches.forEach(m => {
            if (!matchesHierarchy[m.country]) {
                matchesHierarchy[m.country] = {};
            }
            if (!matchesHierarchy[m.country][m.league]) {
                matchesHierarchy[m.country][m.league] = [];
            }
            matchesHierarchy[m.country][m.league].push(m);
        });

        for (const [country, leaguesObj] of Object.entries(matchesHierarchy)) {
            
            const countryHeader = document.createElement('div');
            countryHeader.className = 'country-header';
            countryHeader.innerHTML = `🌍 ${country}`;
            list.appendChild(countryHeader);

            for (const [league, leagueMatches] of Object.entries(leaguesObj)) {
                
                const leagueHeader = document.createElement('div');
                leagueHeader.className = 'league-header';
                leagueHeader.innerText = `🏆 ${league}`;
                list.appendChild(leagueHeader);

                leagueMatches.forEach(m => {
                    const el = document.createElement('div');
                    el.className = 'match-card';
                    
                    const checkActive = (outcome) => {
                        return this.selectedBets.some(b => b.match.id === m.id && b.outcome === outcome) ? 'background: var(--primary-color); color: black;' : '';
                    };

                    let oddsHtml = '';
                    if (m.odds.draw) {
                        oddsHtml = `
                            <button class="odd-btn" style="${checkActive('home')}" onclick="sports.selectBet(${m.id}, 'home')">1<br>${m.odds.home}</button>
                            <button class="odd-btn" style="${checkActive('draw')}" onclick="sports.selectBet(${m.id}, 'draw')">X<br>${m.odds.draw}</button>
                            <button class="odd-btn" style="${checkActive('away')}" onclick="sports.selectBet(${m.id}, 'away')">2<br>${m.odds.away}</button>
                        `;
                    } else {
                        oddsHtml = `
                            <button class="odd-btn" style="${checkActive('home')}" onclick="sports.selectBet(${m.id}, 'home')">1<br>${m.odds.home}</button>
                            <button class="odd-btn" style="${checkActive('away')}" onclick="sports.selectBet(${m.id}, 'away')">2<br>${m.odds.away}</button>
                        `;
                    }

                    el.innerHTML = `
                        <div class="match-info">${m.home} vs ${m.away} <span class="sport-badge">${m.sport}</span></div>
                        <div class="odds-row">
                            ${oddsHtml}
                        </div>
                    `;
                    list.appendChild(el);
                });
            }
        }

        const betInput = document.getElementById('sports-bet-amount');
        if(betInput) betInput.addEventListener('input', () => this.updatePotentialWin());
    },

    selectBet(matchId, outcome) {
        const match = this.matches.find(m => m.id === matchId);
        if(!match) return;

        const odds = parseFloat(match.odds[outcome]);
        const existingBetIndex = this.selectedBets.findIndex(b => b.match.id === matchId);
        
        if (existingBetIndex !== -1) {
            // Un-toggle if clicked again
            if (this.selectedBets[existingBetIndex].outcome === outcome) {
                this.selectedBets.splice(existingBetIndex, 1);
            } else {
                // Change outcome
                this.selectedBets[existingBetIndex] = { match, outcome, odds };
            }
        } else {
            // New bet
            this.selectedBets.push({ match, outcome, odds });
        }

        this.renderMatches(); // Re-render to update active buttons visually
        this.updateBetSlip();
    },

    updateBetSlip() {
        const selInfo = document.getElementById('selected-bet-info');
        
        if (this.selectedBets.length === 0) {
            selInfo.innerHTML = "Ninguna selección";
            document.getElementById('sports-potential-win').innerText = "0";
            return;
        }

        let slipHtml = `<div style="max-height: 200px; overflow-y: auto; margin-bottom: 10px;">`;
        let totalOdds = 1.0;

        this.selectedBets.forEach(bet => {
            const label = bet.outcome === 'home' ? bet.match.home : bet.outcome === 'away' ? bet.match.away : 'Empate';
            totalOdds *= bet.odds;
            
            slipHtml += `
            <div style="border-bottom: 1px solid #444; padding: 5px 0; margin-bottom: 5px;">
                <strong>${label}</strong> a <span style="color:var(--primary-color)">${bet.odds.toFixed(2)}</span><br>
                <small>${bet.match.home} vs ${bet.match.away}</small>
            </div>`;
        });
        
        slipHtml += `</div>
        <div style="font-size:1.1rem; margin-top: 10px;">
            <strong>${this.selectedBets.length > 1 ? 'COMBINADA (PARLAY)' : 'SIMPLE'}</strong><br>
            Cuota Total: <span style="color:var(--primary-color)">${totalOdds.toFixed(2)}</span>
        </div>`;

        selInfo.innerHTML = slipHtml;
        this.updatePotentialWin(totalOdds);
    },

    clearSlip() {
        this.selectedBets = [];
        this.renderMatches();
        this.updateBetSlip();
    },

    updatePotentialWin(providedTotalOdds = null) {
        let totalOdds = providedTotalOdds;
        
        if (providedTotalOdds === null) {
            totalOdds = this.selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
        }

        const amount = parseFloat(document.getElementById('sports-bet-amount').value);
        
        if (!isNaN(amount) && amount > 0 && this.selectedBets.length > 0) {
            document.getElementById('sports-potential-win').innerText = (amount * totalOdds).toFixed(2);
        } else {
            document.getElementById('sports-potential-win').innerText = "0";
        }
    },

    placeBet() {
        const msgEl = document.getElementById('sports-message');
        
        if (this.selectedBets.length === 0) {
            msgEl.innerText = "Por favor, selecciona al menos una apuesta.";
            msgEl.style.color = "var(--accent-red)";
            return;
        }

        const amount = parseInt(document.getElementById('sports-bet-amount').value);
        if (isNaN(amount) || amount <= 0 || amount > app.balance) {
            msgEl.innerText = "Monto inválido o saldo insuficiente.";
            msgEl.style.color = "var(--accent-red)";
            return;
        }

        app.updateBalance(-amount);
        
        const totalOdds = this.selectedBets.reduce((acc, bet) => acc * bet.odds, 1);
        
        msgEl.innerText = "Simulando todos los partidos de tu boleto...";
        msgEl.style.color = "white";
        
        document.querySelector('.sports-bet-controls button').disabled = true;

        setTimeout(() => {
            let parlayWon = true;

            this.selectedBets.forEach(bet => {
                const winProbability = (1 / bet.odds) * 0.95; // 5% house edge on simulation
                const isWin = Math.random() < winProbability;
                if (!isWin) parlayWon = false;
            });

            document.querySelector('.sports-bet-controls button').disabled = false;

            if (parlayWon) {
                const winAmount = Math.floor(amount * totalOdds);
                app.updateBalance(winAmount);
                msgEl.innerText = `¡IMPRESIONANTE! Tu combinada de cuota ${totalOdds.toFixed(2)} fue exitosa. Ganaste $${winAmount.toLocaleString()}.`;
                msgEl.style.color = "var(--accent-green)";
            } else {
                if (this.selectedBets.length > 1) {
                    msgEl.innerText = `Tu combinada se rompió. Al menos una de tus predicciones falló. ¡Prueba otra vez!`;
                } else {
                    msgEl.innerText = `Perdiste la apuesta. ¡Sigue intentando!`;
                }
                msgEl.style.color = "var(--accent-red)";
            }
            
            this.clearSlip();
            
            // Randomly reshuffle matches mimicking real-time odds shifting / daily rollovers
            this.generateVastMatches();
            this.renderMatches();
        }, 2000 + (this.selectedBets.length * 500)); // Delay increases based on how many matches are simulated
    }
};
