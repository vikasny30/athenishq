/**
 * OwlCalc Web App Controller
 * Binds UI inputs, renders interactive modes, manages reactive state & events.
 */

document.addEventListener('DOMContentLoaded', () => {
  // UI Element References
  const calcResultEl = document.getElementById('calc-result');
  const calcExprEl = document.getElementById('calc-expr');
  const tapeCanvasEl = document.getElementById('tape-canvas');
  const keypadContainer = document.getElementById('keypad-container');
  const calcModeTabs = document.querySelectorAll('.mode-tab');
  const specializedViewEl = document.getElementById('specialized-view');
  const calcMainViewEl = document.getElementById('calc-main-view');

  // Active State Machine
  let activeMode = 'basic';
  let calcSubMode = 'basic'; // 'basic' | 'scientific'
  let expression = '';
  let displayResult = '0';
  let memoryValue = 0;

  // Interop payload reference
  let currentInterop = null;

  // Render Theme Handler
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  let currentTheme = localStorage.getItem('owlcalc_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'glass' : currentTheme === 'glass' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('owlcalc_theme', currentTheme);
      themeToggleBtn.innerText = `Theme: ${currentTheme.toUpperCase()}`;
    });
  }

  // Tape Subscription
  windowTapeStore.subscribe((nodes, interop) => {
    currentInterop = interop;
    renderTape(nodes);
    checkInteropBanner();
  });

  // Mode Selection Tabs
  calcModeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      calcModeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeMode = tab.dataset.mode;
      renderActiveView();
    });
  });

  function renderActiveView() {
    if (activeMode === 'basic' || activeMode === 'scientific') {
      calcSubMode = activeMode;
      calcMainViewEl.style.display = 'flex';
      specializedViewEl.style.display = 'none';
      renderKeypad();
    } else {
      calcMainViewEl.style.display = 'none';
      specializedViewEl.style.display = 'flex';
      renderSpecializedCalculator(activeMode);
    }
  }

  // Dynamic Font Size Scaling
  function updateDisplay() {
    calcExprEl.innerText = expression || '';
    calcResultEl.innerText = displayResult || '0';

    const len = (displayResult || '').length;
    if (len <= 7) calcResultEl.style.fontSize = '40px';
    else if (len <= 9) calcResultEl.style.fontSize = '32px';
    else if (len <= 11) calcResultEl.style.fontSize = '26px';
    else if (len <= 13) calcResultEl.style.fontSize = '22px';
    else calcResultEl.style.fontSize = '18px';
  }

  // Keypad Matrix Definitions
  const BASIC_KEYS = [
    { label: 'C', type: 'action', key: 'C' },
    { label: '⌫', type: 'action', key: 'BACK' },
    { label: '%', type: 'op', key: '%' },
    { label: '÷', type: 'op', key: '÷' },

    { label: '7', type: 'num', key: '7' },
    { label: '8', type: 'num', key: '8' },
    { label: '9', type: 'num', key: '9' },
    { label: '×', type: 'op', key: '×' },

    { label: '4', type: 'num', key: '4' },
    { label: '5', type: 'num', key: '5' },
    { label: '6', type: 'num', key: '6' },
    { label: '−', type: 'op', key: '−' },

    { label: '1', type: 'num', key: '1' },
    { label: '2', type: 'num', key: '2' },
    { label: '3', type: 'num', key: '3' },
    { label: '+', type: 'op', key: '+' },

    { label: '±', type: 'num', key: '±' },
    { label: '0', type: 'num', key: '0' },
    { label: '.', type: 'num', key: '.' },
    { label: '=', type: 'equals', key: '=' }
  ];

  const SCIENTIFIC_KEYS = [
    { label: 'sin', type: 'fn', key: 'sin(' },
    { label: 'cos', type: 'fn', key: 'cos(' },
    { label: 'tan', type: 'fn', key: 'tan(' },
    { label: 'C', type: 'action', key: 'C' },
    { label: '÷', type: 'op', key: '÷' },

    { label: 'ln', type: 'fn', key: 'ln(' },
    { label: 'log', type: 'fn', key: 'log(' },
    { label: '√', type: 'fn', key: 'sqrt(' },
    { label: '⌫', type: 'action', key: 'BACK' },
    { label: '×', type: 'op', key: '×' },

    { label: 'π', type: 'fn', key: 'π' },
    { label: 'e', type: 'fn', key: 'e' },
    { label: '^', type: 'fn', key: '^' },
    { label: '7', type: 'num', key: '7' },
    { label: '8', type: 'num', key: '8' },

    { label: '9', type: 'num', key: '9' },
    { label: '4', type: 'num', key: '4' },
    { label: '5', type: 'num', key: '5' },
    { label: '6', type: 'num', key: '6' },
    { label: '−', type: 'op', key: '−' },

    { label: '(', type: 'fn', key: '(' },
    { label: ')', type: 'fn', key: ')' },
    { label: '1', type: 'num', key: '1' },
    { label: '2', type: 'num', key: '2' },
    { label: '3', type: 'num', key: '3' },

    { label: '+', type: 'op', key: '+' },
    { label: '0', type: 'num', key: '0' },
    { label: '.', type: 'num', key: '.' },
    { label: '=', type: 'equals', key: '=' }
  ];

  function renderKeypad() {
    keypadContainer.innerHTML = '';
    const isSci = calcSubMode === 'scientific';
    keypadContainer.className = `calc-keypad ${isSci ? 'scientific-mode' : ''}`;
    const keys = isSci ? SCIENTIFIC_KEYS : BASIC_KEYS;

    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = `calc-key key-${k.type}`;
      btn.innerText = k.label;
      btn.addEventListener('click', () => handleKeyPress(k.key));
      keypadContainer.appendChild(btn);
    });
  }

  function handleKeyPress(key) {
    if (displayResult === 'Error' || displayResult === 'Math Error') {
      expression = key === '=' ? '' : key;
      displayResult = '0';
      updateDisplay();
      return;
    }

    if (key === 'C') {
      expression = '';
      displayResult = '0';
    } else if (key === 'BACK') {
      expression = expression.slice(0, -1);
    } else if (key === '±') {
      if (expression.startsWith('-')) expression = expression.substring(1);
      else expression = '-' + expression;
    } else if (key === '=') {
      if (!expression.trim()) return;
      const res = MathEngine.evaluate(expression, calcSubMode);
      displayResult = res.displayLabel;
      if (res.displayLabel !== 'Error' && res.displayLabel !== 'Math Error') {
        windowTapeStore.addNode(expression, res.rawValue, res.displayLabel, calcSubMode);
      }
    } else {
      expression += key;
    }
    updateDisplay();
  }

  // Tape Rendering
  function renderTape(nodes) {
    tapeCanvasEl.innerHTML = '';
    if (!nodes || nodes.length === 0) {
      tapeCanvasEl.innerHTML = '<div style="color: var(--text-muted); font-size: 11px; text-align: center; margin-top: 12px;">Interactive Tape History will appear here.</div>';
      return;
    }

    nodes.forEach(n => {
      const item = document.createElement('div');
      item.className = 'tape-item';
      item.innerHTML = `
        <span class="tape-expr">${n.rawExpression || n.displayLabel}</span>
        <span class="tape-val">${n.displayLabel}</span>
      `;
      item.addEventListener('click', () => {
        expression = n.rawExpression || String(n.rawValue);
        displayResult = n.displayLabel;
        updateDisplay();
      });
      tapeCanvasEl.appendChild(item);
    });
  }

  // Interop Banner Handler
  function checkInteropBanner() {
    const banner = document.getElementById('interop-banner');
    if (banner && currentInterop) {
      banner.style.display = 'flex';
      banner.querySelector('.interop-label').innerText = `Insert Last Result: ${currentInterop.displayLabel}`;
    }
  }

  // Render Specialized Utility Views
  function renderSpecializedCalculator(mode) {
    let html = '';
    const interopVal = currentInterop ? currentInterop.rawValue : 100;

    if (currentInterop) {
      html += `
        <div id="interop-banner" class="interop-banner">
          <span class="interop-label">Tap to Insert: ${currentInterop.displayLabel}</span>
          <span style="font-weight: 800;">+ INSERT</span>
        </div>
      `;
    }

    if (mode === 'currency') {
      html += `
        <div class="input-group">
          <label>Amount</label>
          <input type="number" id="curr-amount" class="input-field" value="${interopVal}" />
        </div>
        <div style="display: flex; gap: 8px;">
          <div class="input-group" style="flex: 1;">
            <label>From Currency</label>
            <select id="curr-from" class="input-field">
              <option value="USD" selected>USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
          <div class="input-group" style="flex: 1;">
            <label>To Currency</label>
            <select id="curr-to" class="input-field">
              <option value="EUR" selected>EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="INR">INR (₹)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
        </div>
        <div class="result-card" id="curr-result-card">
          <span style="font-size: 11px; color: var(--text-secondary);">Converted Exchange Result</span>
          <h3 id="curr-result-val">$100 USD = €92.00 EUR</h3>
        </div>
      `;
    } else if (mode === 'tip') {
      html += `
        <div class="input-group">
          <label>Bill Total ($)</label>
          <input type="number" id="tip-bill" class="input-field" value="${interopVal}" />
        </div>
        <div style="display: flex; gap: 8px;">
          <div class="input-group" style="flex: 1;">
            <label>Tip %</label>
            <input type="number" id="tip-pct" class="input-field" value="18" />
          </div>
          <div class="input-group" style="flex: 1;">
            <label>Split (People)</label>
            <input type="number" id="tip-split" class="input-field" value="2" />
          </div>
        </div>
        <div class="result-card">
          <span style="font-size: 11px; color: var(--text-secondary);">Per Person Amount</span>
          <h3 id="tip-result-val">$59.00 / person</h3>
          <span id="tip-sub-val" style="font-size: 12px; color: var(--text-muted);">Tip: $18.00 | Total: $118.00</span>
        </div>
      `;
    } else if (mode === 'unit_converter') {
      html += `
        <div class="input-group">
          <label>Value</label>
          <input type="number" id="unit-val" class="input-field" value="${interopVal}" />
        </div>
        <div style="display: flex; gap: 8px;">
          <div class="input-group" style="flex: 1;">
            <label>From Unit</label>
            <select id="unit-from" class="input-field">
              <option value="m" selected>Meters (m)</option>
              <option value="km">Kilometers (km)</option>
              <option value="ft">Feet (ft)</option>
              <option value="in">Inches (in)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
          <div class="input-group" style="flex: 1;">
            <label>To Unit</label>
            <select id="unit-to" class="input-field">
              <option value="km" selected>Kilometers (km)</option>
              <option value="m">Meters (m)</option>
              <option value="ft">Feet (ft)</option>
              <option value="in">Inches (in)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
        </div>
        <div class="result-card">
          <span style="font-size: 11px; color: var(--text-secondary);">Converted Distance</span>
          <h3 id="unit-result-val">0.1 km</h3>
        </div>
      `;
    } else if (mode === 'bmi') {
      html += `
        <div class="input-group">
          <label>Height (cm)</label>
          <input type="number" id="bmi-height" class="input-field" value="175" />
        </div>
        <div class="input-group">
          <label>Weight (kg)</label>
          <input type="number" id="bmi-weight" class="input-field" value="${interopVal > 30 && interopVal < 200 ? interopVal : 70}" />
        </div>
        <div class="result-card">
          <span style="font-size: 11px; color: var(--text-secondary);">Body Mass Index</span>
          <h3 id="bmi-result-val">BMI 22.9 (Normal)</h3>
        </div>
      `;
    } else if (mode === 'discount') {
      html += `
        <div class="input-group">
          <label>Original Price ($)</label>
          <input type="number" id="disc-price" class="input-field" value="${interopVal}" />
        </div>
        <div style="display: flex; gap: 8px;">
          <div class="input-group" style="flex: 1;">
            <label>Discount %</label>
            <input type="number" id="disc-pct" class="input-field" value="20" />
          </div>
          <div class="input-group" style="flex: 1;">
            <label>Tax %</label>
            <input type="number" id="disc-tax" class="input-field" value="8" />
          </div>
        </div>
        <div class="result-card">
          <span style="font-size: 11px; color: var(--text-secondary);">Final Price (After Savings)</span>
          <h3 id="disc-result-val">$86.40</h3>
          <span id="disc-sub-val" style="font-size: 12px; color: var(--accent-emerald);">You save $20.00!</span>
        </div>
      `;
    } else if (mode === 'loan') {
      html += `
        <div class="input-group">
          <label>Principal Amount ($)</label>
          <input type="number" id="loan-amount" class="input-field" value="${interopVal > 1000 ? interopVal : 250000}" />
        </div>
        <div style="display: flex; gap: 8px;">
          <div class="input-group" style="flex: 1;">
            <label>Interest Rate %</label>
            <input type="number" id="loan-rate" class="input-field" value="6.5" step="0.1" />
          </div>
          <div class="input-group" style="flex: 1;">
            <label>Term (Years)</label>
            <input type="number" id="loan-term" class="input-field" value="30" />
          </div>
        </div>
        <div class="result-card">
          <span style="font-size: 11px; color: var(--text-secondary);">Monthly Payment</span>
          <h3 id="loan-result-val">$1,580.17 / mo</h3>
          <span id="loan-sub-val" style="font-size: 12px; color: var(--text-muted);">Total Interest: $318,861.20</span>
        </div>
      `;
    } else {
      html += `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px;">${mode.toUpperCase()} Calculator mode ready.</div>`;
    }

    specializedViewEl.innerHTML = html;

    // Attach Input Event Listeners
    attachSpecializedListeners(mode);
  }

  function attachSpecializedListeners(mode) {
    const interopBtn = document.getElementById('interop-banner');
    if (interopBtn && currentInterop) {
      interopBtn.addEventListener('click', () => {
        const input = specializedViewEl.querySelector('.input-field');
        if (input) {
          input.value = currentInterop.rawValue;
          input.dispatchEvent(new Event('input'));
        }
      });
    }

    if (mode === 'currency') {
      const amtEl = document.getElementById('curr-amount');
      const fromEl = document.getElementById('curr-from');
      const toEl = document.getElementById('curr-to');
      const resValEl = document.getElementById('curr-result-val');

      const update = () => {
        const res = OwlCalculators.convertCurrency(amtEl.value, fromEl.value, toEl.value);
        resValEl.innerText = res.displayLabel;
      };
      [amtEl, fromEl, toEl].forEach(el => el && el.addEventListener('input', update));
      update();
    } else if (mode === 'tip') {
      const billEl = document.getElementById('tip-bill');
      const pctEl = document.getElementById('tip-pct');
      const splitEl = document.getElementById('tip-split');
      const resValEl = document.getElementById('tip-result-val');
      const subValEl = document.getElementById('tip-sub-val');

      const update = () => {
        const res = OwlCalculators.calculateTip(billEl.value, pctEl.value, splitEl.value);
        resValEl.innerText = `$${res.perPerson} / person`;
        subValEl.innerText = `Tip: $${res.tipAmount} | Grand Total: $${res.grandTotal}`;
      };
      [billEl, pctEl, splitEl].forEach(el => el && el.addEventListener('input', update));
      update();
    } else if (mode === 'unit_converter') {
      const valEl = document.getElementById('unit-val');
      const fromEl = document.getElementById('unit-from');
      const toEl = document.getElementById('unit-to');
      const resValEl = document.getElementById('unit-result-val');

      const update = () => {
        const res = OwlCalculators.convertUnit(valEl.value, 'length', fromEl.value, toEl.value);
        resValEl.innerText = `${res.converted} ${toEl.value}`;
      };
      [valEl, fromEl, toEl].forEach(el => el && el.addEventListener('input', update));
      update();
    } else if (mode === 'bmi') {
      const hEl = document.getElementById('bmi-height');
      const wEl = document.getElementById('bmi-weight');
      const resValEl = document.getElementById('bmi-result-val');

      const update = () => {
        const res = OwlCalculators.calculateBMI(hEl.value, wEl.value);
        resValEl.innerText = `BMI ${res.bmi} (${res.category})`;
        resValEl.style.color = res.color;
      };
      [hEl, wEl].forEach(el => el && el.addEventListener('input', update));
      update();
    } else if (mode === 'discount') {
      const pEl = document.getElementById('disc-price');
      const dEl = document.getElementById('disc-pct');
      const tEl = document.getElementById('disc-tax');
      const resValEl = document.getElementById('disc-result-val');
      const subValEl = document.getElementById('disc-sub-val');

      const update = () => {
        const res = OwlCalculators.calculateDiscount(pEl.value, dEl.value, tEl.value);
        resValEl.innerText = `$${res.finalTotal}`;
        subValEl.innerText = `You save $${res.totalSavings}!`;
      };
      [pEl, dEl, tEl].forEach(el => el && el.addEventListener('input', update));
      update();
    } else if (mode === 'loan') {
      const pEl = document.getElementById('loan-amount');
      const rEl = document.getElementById('loan-rate');
      const tEl = document.getElementById('loan-term');
      const resValEl = document.getElementById('loan-result-val');
      const subValEl = document.getElementById('loan-sub-val');

      const update = () => {
        const res = OwlCalculators.calculateLoan(pEl.value, rEl.value, tEl.value);
        resValEl.innerText = `$${res.monthlyPayment} / mo`;
        subValEl.innerText = `Total Interest: $${res.totalInterest}`;
      };
      [pEl, rEl, tEl].forEach(el => el && el.addEventListener('input', update));
      update();
    }
  }

  // Keyboard Event Listener for Desktop Users
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (activeMode !== 'basic' && activeMode !== 'scientific') return;

    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      handleKeyPress(e.key);
    } else if (e.key === '+') handleKeyPress('+');
    else if (e.key === '-') handleKeyPress('−');
    else if (e.key === '*') handleKeyPress('×');
    else if (e.key === '/') handleKeyPress('÷');
    else if (e.key === 'Enter' || e.key === '=') handleKeyPress('=');
    else if (e.key === 'Backspace') handleKeyPress('BACK');
    else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleKeyPress('C');
  });

  // Initial Setup
  renderKeypad();
  updateDisplay();
  renderTape(windowTapeStore.nodes);
});
