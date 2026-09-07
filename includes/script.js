const expressionBox = document.getElementById("expression");
const resultBox = document.getElementById("result");

const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");

let expression = "";

let history = JSON.parse(
  localStorage.getItem("calculatorHistory") || "[]"
);


function updateDisplay() {
  expressionBox.textContent = expression || "";
}


function addValue(value) {

  if (value === ".") {

    const parts = expression.split(
      /[\+\-\*\/%]/
    );

    const currentNumber =
      parts[parts.length - 1];

    if (currentNumber.includes(".")) {
      return;
    }

    if (!currentNumber) {
      expression += "0";
    }
  }

  expression += value;

  updateDisplay();
}


function clearCalculator() {

  expression = "";

  expressionBox.textContent = "";

  resultBox.textContent = "0";
}


function backspace() {

  expression = expression.slice(0, -1);

  updateDisplay();

  if (!expression) {
    resultBox.textContent = "0";
  }
}


async function calculate() {

  if (!expression) {
    return;
  }

  resultBox.textContent = "...";

  try {

    const response = await fetch(
      "/api/calculate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          expression: expression
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {

      resultBox.textContent =
        "Error";

      return;
    }

    const originalExpression =
      expression;

    const result =
      data.result;

    expressionBox.textContent =
      originalExpression + " =";

    resultBox.textContent =
      result;

    saveHistory(
      originalExpression,
      result
    );

    expression =
      String(result);

  } catch (error) {

    console.error(error);

    resultBox.textContent =
      "Error";
  }
}


function saveHistory(expression, result) {

  history.unshift({
    expression,
    result
  });

  history =
    history.slice(0, 30);

  localStorage.setItem(
    "calculatorHistory",
    JSON.stringify(history)
  );

  renderHistory();
}


function renderHistory() {

  if (!history.length) {

    historyList.innerHTML =
      '<p class="empty">No hay operaciones todavía.</p>';

    return;
  }

  historyList.innerHTML =
    history
      .map(
        (item, index) => `
          <div
            class="history-item"
            data-index="${index}"
          >

            <div class="history-expression">
              ${escapeHTML(item.expression)}
            </div>

            <div class="history-result">
              = ${escapeHTML(String(item.result))}
            </div>

          </div>
        `
      )
      .join("");

  document
    .querySelectorAll(".history-item")
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const selected =
            history[item.dataset.index];

          expression =
            String(selected.result);

          expressionBox.textContent =
            selected.expression + " =";

          resultBox.textContent =
            selected.result;

          historyPanel.classList.remove(
            "open"
          );
        }
      );
    });
}


function escapeHTML(text) {

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


document
  .querySelectorAll(".key")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const value =
          button.dataset.value;

        const action =
          button.dataset.action;

        if (action === "clear") {
          clearCalculator();
          return;
        }

        if (action === "backspace") {
          backspace();
          return;
        }

        if (action === "calculate") {
          calculate();
          return;
        }

        if (value) {
          addValue(value);
        }
      }
    );
  });


document
  .getElementById("historyBtn")
  .addEventListener(
    "click",
    () => {

      renderHistory();

      historyPanel.classList.add(
        "open"
      );
    }
  );


document
  .getElementById("closeHistory")
  .addEventListener(
    "click",
    () => {

      historyPanel.classList.remove(
        "open"
      );
    }
  );


document
  .getElementById("clearHistory")
  .addEventListener(
    "click",
    () => {

      history = [];

      localStorage.removeItem(
        "calculatorHistory"
      );

      renderHistory();
    }
  );


document.addEventListener(
  "keydown",
  event => {

    const key = event.key;

    if (
      /^[0-9.]$/.test(key) ||
      ["+", "-", "*", "/", "%"].includes(key)
    ) {

      addValue(key);

      return;
    }

    if (
      key === "Enter" ||
      key === "="
    ) {

      event.preventDefault();

      calculate();

      return;
    }

    if (key === "Backspace") {

      backspace();

      return;
    }

    if (key === "Escape") {

      clearCalculator();
    }
  }
);


renderHistory();
