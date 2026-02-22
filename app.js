/* ============================================
   Niu Niu PWA — Game Logic & UI Controller
   ============================================ */

// ── State ──
const hand = [];        // [{value, label}, ...]  max 5
const MAX_CARDS = 5;

// ── DOM refs ──
const handSlots = document.getElementById('handSlots');
const handCount = document.getElementById('handCount');
const cardGrid = document.getElementById('cardGrid');
const btnCalculate = document.getElementById('btnCalculate');
const btnReset = document.getElementById('btnReset');
const resultSection = document.getElementById('resultSection');
const resultCard = document.getElementById('resultCard');

// ── Init ──
function init() {
    // Card picker buttons
    cardGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.card-btn');
        if (!btn || hand.length >= MAX_CARDS) return;
        const value = parseInt(btn.dataset.value);
        const label = btn.dataset.label;
        addCard(value, label);
    });

    // Hand slot tap → remove card
    handSlots.addEventListener('click', (e) => {
        const slot = e.target.closest('.hand-slot.filled');
        if (!slot) return;
        const idx = parseInt(slot.dataset.index);
        removeCard(idx);
    });

    btnCalculate.addEventListener('click', calculate);
    btnReset.addEventListener('click', resetAll);

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    }
}

// ── Card Management ──
function addCard(value, label) {
    if (hand.length >= MAX_CARDS) return;
    hand.push({ value, label });
    renderHand();
    hideResult();
}

function removeCard(index) {
    if (index < 0 || index >= hand.length) return;
    hand.splice(index, 1);
    renderHand();
    hideResult();
}

function resetAll() {
    hand.length = 0;
    renderHand();
    hideResult();
    clearHighlights();
}

function renderHand() {
    const slots = handSlots.querySelectorAll('.hand-slot');
    slots.forEach((slot, i) => {
        slot.classList.remove('filled', 'empty', 'trio-highlight', 'pair-highlight', 'double-highlight');
        slot.innerHTML = '';
        if (i < hand.length) {
            slot.classList.add('filled');
            const { value, label } = hand[i];
            slot.innerHTML = `<span>${label}</span>` +
                (label !== String(value) ? `<span class="card-face-label">= ${value}</span>` : '');
        } else {
            slot.classList.add('empty');
            slot.innerHTML = '<span class="slot-placeholder">+</span>';
        }
    });

    handCount.textContent = `${hand.length} / ${MAX_CARDS}`;
    btnCalculate.disabled = hand.length !== MAX_CARDS;
}

function clearHighlights() {
    handSlots.querySelectorAll('.hand-slot').forEach((s) => {
        s.classList.remove('trio-highlight', 'pair-highlight', 'double-highlight');
    });
}

// ── Game Logic ──

/**
 * Generate all variants where 3 and 6 are interchangeable.
 * Each element is an array of {value, label} objects.
 */
function generateVariants(cards) {
    const options = cards.map((c) => {
        if (c.value === 3) return [{ ...c, value: 3 }, { ...c, value: 6 }];
        if (c.value === 6) return [{ ...c, value: 6 }, { ...c, value: 3 }];
        return [c];
    });

    const results = [];
    const seen = new Set();

    function recurse(idx, current) {
        if (idx === options.length) {
            const key = current.map((c) => c.value).join(',');
            if (!seen.has(key)) {
                seen.add(key);
                results.push([...current]);
            }
            return;
        }
        for (const opt of options[idx]) {
            current.push(opt);
            recurse(idx + 1, current);
            current.pop();
        }
    }

    recurse(0, []);
    return results;
}

/**
 * Get all combinations of `k` indices from `n`.
 */
function combinations(n, k) {
    const result = [];
    function recurse(start, combo) {
        if (combo.length === k) { result.push([...combo]); return; }
        for (let i = start; i < n; i++) {
            combo.push(i);
            recurse(i + 1, combo);
            combo.pop();
        }
    }
    recurse(0, []);
    return result;
}

/**
 * Is (newScore, newDouble) better than (oldScore, oldDouble)?
 * Double pair always beats non-double. Same category → higher score wins.
 */
function isBetter(newScore, newDouble, oldScore, oldDouble) {
    if (oldScore < 0) return true;
    if (newDouble && !oldDouble) return true;
    if (!newDouble && oldDouble) return false;
    return newScore > oldScore;
}

/**
 * Evaluate a single hand of 5 cards (no swapping).
 */
function evaluateHand(cards) {
    const values = cards.map((c) => c.value);
    let bestScore = -1;
    let bestDouble = false;
    let bestTrio = null;
    let bestPair = null;

    for (const trioIdx of combinations(5, 3)) {
        const trio = trioIdx.map((i) => values[i]);
        const trioSum = trio.reduce((a, b) => a + b, 0);
        if (trioSum % 10 !== 0) continue;

        const pairIdx = [0, 1, 2, 3, 4].filter((i) => !trioIdx.includes(i));
        const pair = pairIdx.map((i) => values[i]);
        const pairSum = pair.reduce((a, b) => a + b, 0);

        let score = pairSum % 10;
        if (score === 0) score = 10;

        const isDouble = pair[0] === pair[1];

        if (isBetter(score, isDouble, bestScore, bestDouble)) {
            bestScore = score;
            bestDouble = isDouble;
            bestTrio = trioIdx;
            bestPair = pairIdx;
        }
    }

    return {
        hasNiu: bestScore > 0,
        score: bestScore,
        isDouble: bestDouble,
        trioIndices: bestTrio,
        pairIndices: bestPair,
    };
}

/**
 * Main calculation: try all 3↔6 variants, return the best.
 */
function calculateNiuNiu(cards) {
    let best = { hasNiu: false, score: -1, isDouble: false, trioIndices: null, pairIndices: null, variant: null, swapped: false };

    for (const variant of generateVariants(cards)) {
        const result = evaluateHand(variant);
        if (result.hasNiu && isBetter(result.score, result.isDouble, best.score, best.isDouble)) {
            const swapped = variant.some((c, i) => c.value !== cards[i].value);
            best = { ...result, variant, swapped };
        }
    }

    return best;
}

// ── Calculate & Display ──

function calculate() {
    if (hand.length !== MAX_CARDS) return;

    const result = calculateNiuNiu(hand);
    showResult(result);

    // Highlight hand slots
    clearHighlights();
    if (result.hasNiu) {
        const slots = handSlots.querySelectorAll('.hand-slot');
        result.trioIndices.forEach((i) => slots[i].classList.add('trio-highlight'));
        result.pairIndices.forEach((i) => {
            slots[i].classList.add(result.isDouble ? 'double-highlight' : 'pair-highlight');
        });
    }
}

function showResult(result) {
    resultSection.classList.remove('hidden');

    if (!result.hasNiu) {
        resultCard.innerHTML = `
      <div class="result-status lose">
        <span class="result-emoji">❌</span>
        <div>
          <div class="result-title">No Niu (没牛)</div>
          <div class="result-subtitle">No valid combination found</div>
        </div>
      </div>
    `;
        return;
    }

    const values = (result.variant || hand).map((c) => c.value);
    const trioValues = result.trioIndices.map((i) => values[i]);
    const pairValues = result.pairIndices.map((i) => values[i]);
    const trioSum = trioValues.reduce((a, b) => a + b, 0);
    const pairSum = pairValues.reduce((a, b) => a + b, 0);

    const isNiuNiu = result.score === 10;
    const emoji = isNiuNiu ? '🏆' : '✅';
    const title = isNiuNiu ? 'Niu Niu! (牛牛)' : 'Valid Niu Found!';
    const subtitle = isNiuNiu ? 'Best possible hand!' : 'Good hand';
    const scoreClass = isNiuNiu ? 'niu-niu' : '';

    let html = `
    <div class="result-status win">
      <span class="result-emoji">${emoji}</span>
      <div>
        <div class="result-title">${title}</div>
        <div class="result-subtitle">${subtitle}</div>
      </div>
    </div>

    <div class="score-display">
      <div>
        <div class="score-number ${scoreClass}">${result.score}</div>
        <div class="score-label">${isNiuNiu ? '🐂 NIU NIU' : 'Score'}</div>
      </div>
    </div>

    <div class="result-details">
      <div class="detail-row trio">
        <span class="detail-label">Group of 3 (×10)</span>
        <span class="detail-value">[${trioValues.join(', ')}] → ${trioSum}</span>
      </div>
      <div class="detail-row pair">
        <span class="detail-label">Remaining pair</span>
        <span class="detail-value">[${pairValues.join(', ')}] → ${pairSum}</span>
      </div>
  `;

    if (result.swapped) {
        const swapDetails = [];
        result.variant.forEach((c, i) => {
            if (c.value !== hand[i].value) {
                swapDetails.push(`${hand[i].value}→${c.value}`);
            }
        });
        html += `
      <div class="detail-row swap">
        <span class="detail-label">3↔6 Swap Used</span>
        <span class="detail-value">${swapDetails.join(', ')}</span>
      </div>
    `;
    }

    html += '</div>';

    if (result.isDouble) {
        html += `
      <div style="text-align:center; margin-top: 14px;">
        <span class="double-badge">💎 Double Pair (${pairValues[0]} = ${pairValues[1]}) — 2× Earning!</span>
      </div>
    `;
    }

    resultCard.innerHTML = html;
}

function hideResult() {
    resultSection.classList.add('hidden');
}

// ── Boot ──
init();
