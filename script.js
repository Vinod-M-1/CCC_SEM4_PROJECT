document.addEventListener('DOMContentLoaded', () => {
    const targetInput = document.getElementById('target-amount');
    const denomsInput = document.getElementById('denominations');
    const speedSlider = document.getElementById('speed-slider');
    const btnGreedy = document.getElementById('btn-greedy');
    const btnDp = document.getElementById('btn-dp');
    const btnReset = document.getElementById('btn-reset');
    
    const statusLabel = document.getElementById('status-label');
    const totalCoinsLabel = document.getElementById('total-coins');
    
    const vizTitle = document.getElementById('viz-title');
    const greedyViz = document.getElementById('greedy-viz');
    const dpViz = document.getElementById('dp-viz');
    
    const greedyTargetVal = document.getElementById('greedy-target-val');
    const greedyCoinsArea = document.getElementById('greedy-coins-area');
    const dpGrid = document.getElementById('dp-grid');

    let abortController = null;

    // Helper: Sleep
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: Get speed
    const getDelay = () => {
        const val = parseInt(speedSlider.value);
        // Slider 1 (slow) to 10 (fast) -> map to ms
        // 1 -> 1000ms, 10 -> 50ms
        return 1000 - ((val - 1) * (950 / 9)); 
    };

    // Helper: Parse inputs
    const getInputs = () => {
        const target = parseInt(targetInput.value);
        const denomsStr = denomsInput.value;
        const denoms = denomsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        
        if (isNaN(target) || target <= 0) {
            triggerError(targetInput);
            return null;
        }
        if (denoms.length === 0) {
            triggerError(denomsInput);
            return null;
        }

        return { target, denoms: [...new Set(denoms)].sort((a, b) => b - a) }; // descending for greedy initially
    };

    const triggerError = (element) => {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
        setStatus('Error', 'error');
    };

    const setStatus = (text, type) => {
        statusLabel.textContent = text;
        statusLabel.className = `badge ${type}`;
    };

    const resetUI = () => {
        if (abortController) {
            abortController.abort();
        }
        greedyCoinsArea.innerHTML = '';
        dpGrid.innerHTML = '';
        greedyTargetVal.textContent = '0';
        totalCoinsLabel.textContent = '-';
        setStatus('Waiting...', '');
        greedyViz.classList.add('hidden');
        dpViz.classList.add('hidden');
        removeConfetti();
    };

    btnReset.addEventListener('click', resetUI);

    // --- GREEDY ALGORITHM ---
    btnGreedy.addEventListener('click', async () => {
        resetUI();
        const inputs = getInputs();
        if (!inputs) return;

        abortController = new AbortController();
        const signal = abortController.signal;

        vizTitle.textContent = 'Greedy Algorithm';
        greedyViz.classList.remove('hidden');
        
        let { target, denoms } = inputs;
        // Greedy uses descending order
        denoms.sort((a, b) => b - a);

        let currentTarget = target;
        let coinCount = 0;
        let usedCoins = [];

        greedyTargetVal.textContent = currentTarget;

        try {
            for (let i = 0; i < denoms.length; i++) {
                const coin = denoms[i];
                while (currentTarget >= coin) {
                    if (signal.aborted) return;
                    
                    currentTarget -= coin;
                    coinCount++;
                    usedCoins.push(coin);
                    
                    // UI Update
                    greedyTargetVal.textContent = currentTarget;
                    const coinEl = document.createElement('div');
                    coinEl.className = 'coin';
                    coinEl.textContent = coin;
                    greedyCoinsArea.appendChild(coinEl);
                    
                    await sleep(getDelay());
                }
            }

            if (currentTarget === 0) {
                totalCoinsLabel.textContent = coinCount;
                setStatus('Completed', 'optimal');
            } else {
                totalCoinsLabel.textContent = 'N/A';
                triggerError(targetInput);
                setStatus('No Solution', 'error');
            }
        } catch (e) {
            console.log('Aborted');
        }
    });

    // --- DYNAMIC PROGRAMMING ALGORITHM ---
    btnDp.addEventListener('click', async () => {
        resetUI();
        const inputs = getInputs();
        if (!inputs) return;

        abortController = new AbortController();
        const signal = abortController.signal;

        vizTitle.textContent = 'Dynamic Programming';
        dpViz.classList.remove('hidden');

        let { target, denoms } = inputs;
        // DP usually uses ascending order for natural progression
        denoms.sort((a, b) => a - b);

        // Setup Grid
        dpGrid.style.gridTemplateColumns = `repeat(${target + 1}, minmax(50px, 1fr))`;
        const cells = [];
        for (let i = 0; i <= target; i++) {
            const cell = document.createElement('div');
            cell.className = 'dp-cell';
            
            const idx = document.createElement('div');
            idx.className = 'idx';
            idx.textContent = i;
            
            const val = document.createElement('div');
            val.className = 'val';
            val.textContent = '∞'; // Infinity initially
            
            cell.appendChild(idx);
            cell.appendChild(val);
            dpGrid.appendChild(cell);
            cells.push({ el: cell, valEl: val });
        }

        const dp = new Array(target + 1).fill(Infinity);
        dp[0] = 0;
        cells[0].valEl.textContent = '0';
        cells[0].el.classList.add('calculated');

        try {
            for (let i = 1; i <= target; i++) {
                if (signal.aborted) return;
                
                cells[i].el.classList.add('active');
                await sleep(getDelay() * 0.5);

                for (let c of denoms) {
                    if (signal.aborted) return;
                    if (i - c >= 0) {
                        cells[i - c].el.classList.add('checking');
                        await sleep(getDelay() * 0.5);
                        
                        if (dp[i - c] !== Infinity && dp[i - c] + 1 < dp[i]) {
                            dp[i] = dp[i - c] + 1;
                            cells[i].valEl.textContent = dp[i];
                        }
                        
                        cells[i - c].el.classList.remove('checking');
                    }
                }

                cells[i].el.classList.remove('active');
                cells[i].el.classList.add('calculated');
            }

            if (dp[target] !== Infinity) {
                totalCoinsLabel.textContent = dp[target];
                setStatus('Optimal', 'optimal');
                cells[target].el.classList.add('success');
                createConfetti();
            } else {
                totalCoinsLabel.textContent = 'N/A';
                triggerError(targetInput);
                setStatus('No Solution', 'error');
            }

        } catch (e) {
            console.log('Aborted');
        }
    });

    // --- CONFETTI EFFECT ---
    function createConfetti() {
        if (!document.getElementById('confetti-container')) {
            const container = document.createElement('div');
            container.id = 'confetti-container';
            document.body.appendChild(container);
        }
        const container = document.getElementById('confetti-container');
        
        const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.top = '-10px';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.opacity = Math.random();
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            const duration = Math.random() * 2 + 1;
            confetti.style.animation = `fall ${duration}s linear forwards`;
            
            container.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, duration * 1000);
        }
        
        // Add styles if not present
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function removeConfetti() {
        const container = document.getElementById('confetti-container');
        if (container) {
            container.innerHTML = '';
        }
    }
});
