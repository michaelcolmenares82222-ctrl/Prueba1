import type { GeneratedApp } from "../code-generator";

const APP_TSX = `import { useState } from "react";

type Op = "+" | "-" | "×" | "÷" | null;

export default function App() {
  const [display, setDisplay] = useState("0");
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const clear = () => {
    setDisplay("0");
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const compute = (a: number, b: number, op: Op): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const performOperator = (next: Op) => {
    const value = parseFloat(display);
    if (previous === null) {
      setPrevious(value);
    } else if (operator) {
      const result = compute(previous, value, operator);
      setPrevious(result);
      setDisplay(formatNumber(result));
    }
    setOperator(next);
    setWaitingForOperand(true);
  };

  const equals = () => {
    if (operator === null || previous === null) return;
    const value = parseFloat(display);
    const result = compute(previous, value, operator);
    setDisplay(formatNumber(result));
    setPrevious(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const formatNumber = (n: number): string => {
    if (Number.isNaN(n)) return "Error";
    if (!Number.isFinite(n)) return "∞";
    return Number.parseFloat(n.toPrecision(12)).toString();
  };

  const Button = ({
    label,
    onClick,
    variant = "default",
    span = 1,
  }: {
    label: string;
    onClick: () => void;
    variant?: "default" | "accent" | "muted";
    span?: 1 | 2;
  }) => {
    const base =
      "h-16 rounded-2xl text-xl font-medium transition active:scale-95 select-none";
    const variants: Record<string, string> = {
      default: "bg-slate-800 hover:bg-slate-700 text-slate-100",
      accent: "bg-orange-500 hover:bg-orange-400 text-white shadow-lg",
      muted: "bg-slate-700/70 hover:bg-slate-600 text-slate-100",
    };
    return (
      <button
        onClick={onClick}
        className={base + " " + variants[variant] + (span === 2 ? " col-span-2" : "")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur">
        <div className="bg-slate-950/60 rounded-2xl px-4 py-6 mb-4 text-right border border-slate-800">
          <div className="text-xs text-slate-500 uppercase tracking-widest h-4">
            {operator && previous !== null
              ? formatNumber(previous) + " " + operator
              : ""}
          </div>
          <div className="text-4xl font-light text-slate-100 truncate">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Button label="AC" onClick={clear} variant="muted" />
          <Button label="±" onClick={toggleSign} variant="muted" />
          <Button label="%" onClick={percent} variant="muted" />
          <Button label="÷" onClick={() => performOperator("÷")} variant="accent" />

          <Button label="7" onClick={() => inputDigit("7")} />
          <Button label="8" onClick={() => inputDigit("8")} />
          <Button label="9" onClick={() => inputDigit("9")} />
          <Button label="×" onClick={() => performOperator("×")} variant="accent" />

          <Button label="4" onClick={() => inputDigit("4")} />
          <Button label="5" onClick={() => inputDigit("5")} />
          <Button label="6" onClick={() => inputDigit("6")} />
          <Button label="-" onClick={() => performOperator("-")} variant="accent" />

          <Button label="1" onClick={() => inputDigit("1")} />
          <Button label="2" onClick={() => inputDigit("2")} />
          <Button label="3" onClick={() => inputDigit("3")} />
          <Button label="+" onClick={() => performOperator("+")} variant="accent" />

          <Button label="0" onClick={() => inputDigit("0")} span={2} />
          <Button label="." onClick={inputDot} />
          <Button label="=" onClick={equals} variant="accent" />
        </div>
      </div>
    </div>
  );
}
`;

export const calculatorTemplate: GeneratedApp = {
  name: "Calculator",
  description:
    "A clean, iOS-inspired calculator with operator chaining, sign toggle, and percent.",
  preview: "Standard arithmetic, percent, sign flip, and chained operations.",
  dependencies: [],
  files: [
    {
      path: "/App.tsx",
      content: APP_TSX,
      language: "tsx",
    },
  ],
};
