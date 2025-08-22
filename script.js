        const display = document.getElementById('display'); //where numbers/results show
        const ghost = document.getElementById('ghost');// Placeholder text
        const keys = document.querySelectorAll('button.key');// Calculator keys
        const historyEl = document.getElementById('history');// History container
        const historyList = document.getElementById('history-list');// History list
        const clearHistoryBtn = document.getElementById('clear-history');// Clear history button
        const toggleHistoryBtn = document.getElementById('toggle-history');// Toggle history button

        // Load & persist history
        let history = JSON.parse(localStorage.getItem('calc-history') || '[]');// Calculation history
        renderHistory();

        function setDisplay(val, animate = false) {
            display.value = val;
            ghost.textContent = val ? '' : 'Enter an expression…';// Placeholder text 
            if (animate) {
                display.classList.remove('slide-in');
                void display.offsetWidth; // restart animation
                display.classList.add('slide-in');
            }
        }

        // Click handling with ripple
        keys.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                spawnRipple(btn, x, y);

                const key = btn.dataset.key;
                const val = btn.dataset.val;
                if (key === 'C') return setDisplay('');
                if (key === 'DEL') return setDisplay(display.value.slice(0, -1));
                if (key === '=') return calculate();
                append(val);
            });
        });

        function spawnRipple(el, x, y) {
            const r = document.createElement('span');
            r.className = 'ripple';
            r.style.left = x + 'px';
            r.style.top = y + 'px';
            el.appendChild(r);
            r.addEventListener('animationend', () => r.remove());
        }

        function append(ch) {
            // Prevent two operators in a row
            const ops = ['+', '-', '*', '/', '%', '.'];
            const cur = display.value;
            if (!cur && ['+', '*', '/', '%'].includes(ch)) return; // no leading +*/%
            if (ops.includes(ch) && ops.includes(cur.slice(-1))) {
                setDisplay(cur.slice(0, -1) + ch); // replace last operator
                return;
            }
            setDisplay(cur + ch);
        }

        function calculate() {
            const expr = display.value;
            if (!expr) return;
            try {
                // Safe-ish evaluation: allow digits, operators, decimal points and parentheses only
                if (!/^[-+*/%().\d\s]+$/.test(expr)) throw new Error('Invalid');
                // Evaluate
                const res = Function('return ' + expr)();
                const pretty = (Number.isFinite(res)) ? +parseFloat(res.toFixed(10)) : 'Error';
                // save history
                pushHistory(expr, pretty);
                setDisplay(String(pretty), true); // animate result
            } catch (err) {
                setDisplay('Error', true);
            }
        }

        function pushHistory(expr, res) {
            history.unshift({ expr, res, ts: Date.now() });
            history = history.slice(0, 25); // keep last 25
            localStorage.setItem('calc-history', JSON.stringify(history));
            renderHistory();
        }

        function renderHistory() {
            historyList.innerHTML = '';
            if (history.length === 0) {
                const li = document.createElement('li');
                li.style.color = 'var(--muted)';
                li.textContent = 'No calculations yet.';
                historyList.appendChild(li);
                return;
            }
            history.forEach((item, idx) => {
                const li = document.createElement('li');
                li.className = 'history-item';
                li.innerHTML = `<span class="expr">${escapeHtml(item.expr)}</span><span class="res">${escapeHtml(item.res)}</span>`;
                li.addEventListener('click', () => setDisplay(String(item.res)));
                historyList.appendChild(li);
            });
        }

        function escapeHtml(s) {
            return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        }

        clearHistoryBtn.addEventListener('click', () => {
            history = [];
            localStorage.removeItem('calc-history');
            renderHistory();
        });

        toggleHistoryBtn.addEventListener('click', () => {
            if (getComputedStyle(historyEl).display === 'none') {
                historyEl.style.display = 'flex';
                toggleHistoryBtn.setAttribute('aria-expanded', 'true');
            } else {
                historyEl.style.display = 'none';
                toggleHistoryBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            const k = e.key;
            if (/^[0-9]$/.test(k)) { append(k); return; }
            if (['+', '-', '*', '/', '%', '.', '(', ')'].includes(k)) { append(k); return; }
            if (k === 'Enter' || k === '=') { e.preventDefault(); calculate(); return; }
            if (k === 'Backspace') { setDisplay(display.value.slice(0, -1)); return; }
            if (k.toLowerCase() === 'c') { setDisplay(''); return; }
        });

        // Focus ring for accessibility when tabbing
        Array.from(keys).forEach(b => { b.addEventListener('keydown', e => { if (e.key === 'Enter') b.click(); }); });