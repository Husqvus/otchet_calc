// ============ КОНСТАНТЫ ============
const STORAGE_KEY = 'actCalculatorLog_v1';
const MAX_LOG_ENTRIES = 500;

// Сообщения об ошибках (строго по ТЗ)
const ERROR_MESSAGES = {
    EMPTY: 'Пусто так же как в голове после сессии',
    LETTERS: 'Буквы - участь гумманитариев, мы же не такие)',
    ZERO: 'Все на Zero',
    NEGATIVE: 'Почему здесь выходит твоя З/П'
};

// ============ DOM-ЭЛЕМЕНТЫ ============
const planInput = document.getElementById('planInput');
const factInput = document.getElementById('factInput');
const calcBtn = document.getElementById('calcBtn');
const resetBtn = document.getElementById('resetBtn');
const resultBox = document.getElementById('resultBox');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultValue = document.getElementById('resultValue');
const logList = document.getElementById('logList');
const logEmpty = document.getElementById('logEmpty');
const clearLogBtn = document.getElementById('clearLogBtn');

// ============ ВАЛИДАЦИЯ ============
/**
 * Проверяет введённое значение по 4 типам ошибок (строго по ТЗ).
 * Порядок проверок:
 *  1. Пустое поле
 *  2. Буквы/символы (не число)
 *  3. Ровно 0
 *  4. Отрицательное число
 */
function validateInput(rawValue) {
    const trimmed = rawValue.trim();

    // 1. Пустое поле
    if (trimmed === '') {
        return { valid: false, error: ERROR_MESSAGES.EMPTY };
    }

    // 2. Буквы или символы (не число)
    const normalized = trimmed.replace(',', '.');
    const numberRegex = /^-?\d+(\.\d+)?$/;
    if (!numberRegex.test(normalized)) {
        return { valid: false, error: ERROR_MESSAGES.LETTERS };
    }

    const num = parseFloat(normalized);

    if (Number.isNaN(num)) {
        return { valid: false, error: ERROR_MESSAGES.LETTERS };
    }

    // 3. Ровно 0
    if (num === 0) {
        return { valid: false, error: ERROR_MESSAGES.ZERO };
    }

    // 4. Отрицательное число
    if (num < 0) {
        return { valid: false, error: ERROR_MESSAGES.NEGATIVE };
    }

    return { valid: true, number: num };
}

// ============ РАСЧЁТ ============
function calculate() {
    const planRaw = planInput.value;
    const factRaw = factInput.value;

    // Сброс визуальных ошибок
    planInput.classList.remove('input-error');
    factInput.classList.remove('input-error');

    const planCheck = validateInput(planRaw);
    const factCheck = validateInput(factRaw);

    // Если есть ошибки — показываем первую найденную
    if (!planCheck.valid) {
        planInput.classList.add('input-error');
        showError(planCheck.error, 'Ошибка в поле «План»');
        addLogEntry({
            plan: planRaw,
            fact: factRaw,
            isError: true,
            result: `[${planCheck.error}]`
        });
        return;
    }

    if (!factCheck.valid) {
        factInput.classList.add('input-error');
        showError(factCheck.error, 'Ошибка в поле «Факт»');
        addLogEntry({
            plan: planRaw,
            fact: factRaw,
            isError: true,
            result: `[${factCheck.error}]`
        });
        return;
    }

    const plan = planCheck.number;
    const fact = factCheck.number;
    const percent = (fact / plan) * 100;
    const percentRounded = Math.round(percent * 100) / 100;

    showResult(percentRounded, plan, fact);
    addLogEntry({
        plan: planRaw,
        fact: factRaw,
        isError: false,
        result: `${percentRounded}%`
    });
}

// ============ ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА ============
function showResult(percent, plan, fact) {
    resultBox.classList.remove('hidden', 'result-error', 'result-warning', 'result-success');

    let icon = '🎯';
    let title = 'Процент выполнения';
    let variant = 'result-success';

    if (percent >= 100) {
        icon = '🏆';
        title = 'План выполнен или перевыполнен!';
    } else if (percent >= 70) {
        icon = '✅';
        title = 'Хороший показатель';
    } else if (percent >= 40) {
        icon = '⚠️';
        title = 'Есть над чем работать';
        variant = 'result-warning';
    } else {
        icon = '📉';
        title = 'Низкий процент выполнения';
        variant = 'result-warning';
    }

    resultIcon.textContent = icon;
    resultTitle.textContent = title;
    resultValue.textContent = `${percent}% (факт ${fact} / план ${plan})`;
    resultBox.classList.add(variant);

    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(message, title) {
    resultBox.classList.remove('hidden', 'result-success', 'result-warning', 'result-error');
    resultIcon.textContent = '🚫';
    resultTitle.textContent = title;
    resultValue.textContent = `[${message}]`;
    resultBox.classList.add('result-error');
}

// ============ ЖУРНАЛ ЗАПРОСОВ ============
function loadLog() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('Не удалось прочитать журнал:', e);
        return [];
    }
}

function saveLog(log) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (e) {
        console.warn('Не удалось сохранить журнал:', e);
    }
}

function addLogEntry(entry) {
    const log = loadLog();
    const now = new Date();
    const record = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        time: now.toISOString(),
        plan: entry.plan,
        fact: entry.fact,
        isError: entry.isError,
        result: entry.result
    };
    log.push(record);

    if (log.length > MAX_LOG_ENTRIES) {
        log.splice(0, log.length - MAX_LOG_ENTRIES);
    }

    saveLog(log);
    renderLog();
}

function clearLog() {
    if (!confirm('Очистить весь журнал запросов?')) return;
    saveLog([]);
    renderLog();
}

function formatTime(isoString) {
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderLog() {
    const log = loadLog();

    // Очищаем старые записи
    const entries = logList.querySelectorAll('.log-entry');
    entries.forEach((el) => el.remove());

    if (log.length === 0) {
        logEmpty.style.display = 'block';
        clearLogBtn.disabled = true;
        clearLogBtn.style.opacity = '0.5';
        clearLogBtn.style.cursor = 'not-allowed';
        return;
    }

    logEmpty.style.display = 'none';
    clearLogBtn.disabled = false;
    clearLogBtn.style.opacity = '1';
    clearLogBtn.style.cursor = 'pointer';

    // Рендерим записи ПОСТЕПЕННО СВЕРХУ ВНИЗ (новые — внизу)
    const fragment = document.createDocumentFragment();

    log.forEach((record, index) => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.dataset.id = record.id;

        const numberEl = document.createElement('div');
        numberEl.className = 'log-number';
        numberEl.textContent = index + 1;

        const dataEl = document.createElement('div');
        dataEl.className = 'log-data';

        const inputsEl = document.createElement('div');
        inputsEl.className = 'log-inputs';
        inputsEl.innerHTML =
            `План: <strong>${escapeHtml(record.plan || '—')}</strong> · ` +
            `Факт: <strong>${escapeHtml(record.fact || '—')}</strong>`;

        const resultEl = document.createElement('div');
        resultEl.className = 'log-result ' + (record.isError ? 'log-result-error' : 'log-result-success');
        resultEl.textContent = record.result;

        dataEl.appendChild(inputsEl);
        dataEl.appendChild(resultEl);

        const timeEl = document.createElement('div');
        timeEl.className = 'log-time';
        timeEl.textContent = formatTime(record.time);

        entry.appendChild(numberEl);
        entry.appendChild(dataEl);
        entry.appendChild(timeEl);

        fragment.appendChild(entry);
    });

    logList.appendChild(fragment);
}

// ============ СБРОС ============
function resetForm() {
    planInput.value = '';
    factInput.value = '';
    planInput.classList.remove('input-error');
    factInput.classList.remove('input-error');
    resultBox.classList.add('hidden');
    resultBox.classList.remove('result-success', 'result-warning', 'result-error');
    planInput.focus();
}

// ============ СОБЫТИЯ ============
calcBtn.addEventListener('click', calculate);
resetBtn.addEventListener('click', resetForm);
clearLogBtn.addEventListener('click', clearLog);

// Enter для расчёта
[planInput, factInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculate();
        }
    });

    // Убираем подсветку ошибки при вводе
    input.addEventListener('input', () => {
        input.classList.remove('input-error');
    });
});

// ============ ИНИЦИАЛИЗАЦИЯ ============
document.addEventListener('DOMContentLoaded', () => {
    renderLog();
});

if (document.readyState !== 'loading') {
    renderLog();
}