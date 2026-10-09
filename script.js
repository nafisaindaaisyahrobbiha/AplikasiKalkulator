let currentOperand = "0";
let previousOperand = "";
let operation = null;
let shouldResetScreen = false;
let calculationHistory = [];

const prevDisplay = document.getElementById("prevDisplay");
const currentDisplay = document.getElementById("currentDisplay");
const historyDrawer = document.getElementById("historyDrawer");
const historyItems = document.getElementById("historyItems");

const formatDisplayNumber = (numberString) => {
  if (numberString == null || numberString === "") return "0";
  if (numberString === "Error" || numberString === "Tidak terdefinisi") {
    return numberString;
  }
  
  const stringVal = numberString.toString();
  const isNegative = stringVal.startsWith("-");
  const cleanVal = isNegative ? stringVal.slice(1) : stringVal;
  
  const parts = cleanVal.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  let formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";

  const sign = isNegative ? "-" : "";
  if (decimalPart !== undefined) {
    return `${sign}${formattedInteger},${decimalPart}`;
  }
  return `${sign}${formattedInteger}`;
};

function updateDisplay() {
  currentDisplay.innerText = formatDisplayNumber(currentOperand);

  if (currentOperand.length > 12) {
    currentDisplay.style.fontSize = "1.5rem";
  } else if (currentOperand.length > 9) {
    currentDisplay.style.fontSize = "1.85rem";
  } else {
    currentDisplay.style.fontSize = "2.3rem";
  }

  if (operation != null) {
    prevDisplay.innerText = `${formatDisplayNumber(previousOperand)} ${operation}`;
  } else {
    prevDisplay.innerText = "";
  }
}

const appendNumber = (number) => {
  if (shouldResetScreen) {
    currentOperand = "";
    shouldResetScreen = false;
  }

  if (currentOperand === "0" && number === "0") return;
  if (currentOperand === "0" && number !== "0") {
    currentOperand = number;
    return;
  }

  if (currentOperand.length >= 16) return;
  currentOperand += number;
};

function appendDecimal() {
  if (shouldResetScreen) {
    currentOperand = "0";
    shouldResetScreen = false;
  }

  if (currentOperand.includes(".")) return;
  
  if (currentOperand === "") {
    currentOperand = "0.";
  } else {
    currentOperand += ".";
  }
}

const chooseOperation = (selectedOp) => {
  if (currentOperand === "Error" || currentOperand === "Tidak terdefinisi") {
    clearAll();
  }

  if (currentOperand === "" && previousOperand !== "") {
    operation = selectedOp;
    updateDisplay();
    return;
  }

  if (previousOperand !== "") {
    computeResult();
  }

  operation = selectedOp;
  previousOperand = currentOperand;
  currentOperand = "";
};

function computeResult() {
  let computationResult;
  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  if (isNaN(prev) || isNaN(current)) return;

  switch (operation) {
    case "+":
      computationResult = prev + current;
      break;
    case "−":
    case "-":
      computationResult = prev - current;
      break;
    case "×":
    case "*":
      computationResult = prev * current;
      break;
    case "÷":
    case "/":
      if (current === 0) {
        currentOperand = "Tidak terdefinisi";
        operation = null;
        previousOperand = "";
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      computationResult = prev / current;
      break;
    case "%":
      computationResult = prev % current;
      break;
    default:
      return;
  }

  computationResult = Math.round((computationResult + Number.EPSILON) * 1e10) / 1e10;

  const expressionString = `${formatDisplayNumber(prev)} ${operation} ${formatDisplayNumber(current)}`;
  addHistory(expressionString, computationResult);

  currentOperand = computationResult.toString();
  operation = null;
  previousOperand = "";
  shouldResetScreen = true;
}

const clearAll = () => {
  currentOperand = "0";
  previousOperand = "";
  operation = null;
  shouldResetScreen = false;
};

function deleteLast() {
  if (shouldResetScreen || currentOperand === "Error" || currentOperand === "Tidak terdefinisi") {
    clearAll();
    return;
  }

  if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith("-"))) {
    currentOperand = "0";
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }
}

const addHistory = (expr, res) => {
  const item = {
    expression: expr,
    result: res.toString()
  };

  calculationHistory.unshift(item);
  if (calculationHistory.length > 10) {
    calculationHistory.pop();
  }

  renderHistory();
};

function renderHistory() {
  if (calculationHistory.length === 0) {
    historyItems.innerHTML = '<div class="history-empty">Belum ada riwayat</div>';
    return;
  }

  historyItems.innerHTML = "";

  calculationHistory.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.title = "Klik untuk memasukkan angka ini ke kalkulator";
    row.innerHTML = `
      <span class="history-expr">${item.expression} =</span>
      <span class="history-res">${formatDisplayNumber(item.result)}</span>
    `;

    row.addEventListener("click", () => {
      currentOperand = item.result;
      shouldResetScreen = true;
      updateDisplay();
      historyDrawer.classList.add("hidden");
    });

    historyItems.appendChild(row);
  });
}

const keypad = document.querySelector(".calc-grid");

keypad.addEventListener("click", (e) => {
  const target = e.target.closest("button");
  if (!target) return;

  const action = target.dataset.action;
  const num = target.dataset.num;
  const op = target.dataset.op;

  if (num !== undefined) {
    appendNumber(num);
    updateDisplay();
    return;
  }

  if (action === "operator") {
    chooseOperation(op);
    updateDisplay();
    return;
  }

  if (action === "decimal") {
    appendDecimal();
    updateDisplay();
    return;
  }

  if (action === "clear") {
    clearAll();
    updateDisplay();
    return;
  }

  if (action === "delete") {
    deleteLast();
    updateDisplay();
    return;
  }

  if (action === "equals") {
    computeResult();
    updateDisplay();
    return;
  }
});

window.addEventListener("keydown", (e) => {
  let key = e.key;

  if (key === "/" || key === "Enter") {
    e.preventDefault();
  }

  if (key >= "0" && key <= "9") {
    appendNumber(key);
    updateDisplay();
    highlightKey(`[data-num="${key}"]`);
    return;
  }

  if (key === "." || key === ",") {
    appendDecimal();
    updateDisplay();
    highlightKey('[data-action="decimal"]');
    return;
  }

  if (key === "+") {
    chooseOperation("+");
    updateDisplay();
    highlightKey('[data-op="+"]');
    return;
  }
  if (key === "-") {
    chooseOperation("−");
    updateDisplay();
    highlightKey('[data-op="-"]');
    return;
  }
  if (key === "*" || key === "x" || key === "X") {
    chooseOperation("×");
    updateDisplay();
    highlightKey('[data-op="×"]');
    return;
  }
  if (key === "/") {
    chooseOperation("÷");
    updateDisplay();
    highlightKey('[data-op="÷"]');
    return;
  }
  if (key === "%") {
    chooseOperation("%");
    updateDisplay();
    highlightKey('[data-op="%"]');
    return;
  }

  if (key === "Enter" || key === "=") {
    computeResult();
    updateDisplay();
    highlightKey("#btnEquals");
    return;
  }

  if (key === "Backspace") {
    deleteLast();
    updateDisplay();
    highlightKey("#btnDel");
    return;
  }

  if (key === "Escape") {
    clearAll();
    updateDisplay();
    highlightKey("#btnC");
    return;
  }
});

function highlightKey(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    btn.classList.add("key-pressed");
    setTimeout(() => {
      btn.classList.remove("key-pressed");
    }, 140);
  }
}

updateDisplay();
renderHistory();