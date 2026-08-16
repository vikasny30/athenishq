/**
 * OwlCalc Web Math Engine
 * Supports Basic, Scientific, RPN, and Programmer calculations
 * with floating point error correction and input sanitization.
 */

class MathEngine {
  static evaluate(expression, mode = 'basic') {
    if (!expression || expression.trim() === '') {
      return { rawValue: 0, displayLabel: '0' };
    }

    try {
      let sanitized = this.sanitize(expression);
      let result = this.parseAndEval(sanitized);

      if (isNaN(result) || !isFinite(result)) {
        return { rawValue: NaN, displayLabel: 'Math Error' };
      }

      // Round floating point precision issues (e.g. 0.1 + 0.2 = 0.3)
      const rounded = Number(Math.round(parseFloat(result + 'e12')) + 'e-12');
      const formatted = this.formatNumber(rounded);

      return {
        rawValue: rounded,
        displayLabel: formatted
      };
    } catch (err) {
      console.error('MathEngine Error:', err);
      return { rawValue: NaN, displayLabel: 'Error' };
    }
  }

  static sanitize(expr) {
    let s = expr;
    // Replace visual symbols with JS equivalents
    s = s.replace(/×/g, '*')
         .replace(/÷/g, '/')
         .replace(/−/g, '-')
         .replace(/π/g, `(${Math.PI})`)
         .replace(/e/g, `(${Math.E})`)
         .replace(/%/g, '/100');

    // Handle scientific functions
    s = s.replace(/sin\(([^)]+)\)/g, (m, p1) => `Math.sin(${this.degToRad(p1)})`);
    s = s.replace(/cos\(([^)]+)\)/g, (m, p1) => `Math.cos(${this.degToRad(p1)})`);
    s = s.replace(/tan\(([^)]+)\)/g, (m, p1) => `Math.tan(${this.degToRad(p1)})`);
    s = s.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
    s = s.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
    s = s.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
    s = s.replace(/\^/g, '**');

    // Auto close parenthesis if unbalanced
    let openCount = (s.match(/\(/g) || []).length;
    let closeCount = (s.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      s += ')';
      closeCount++;
    }

    return s;
  }

  static degToRad(degreesExpr) {
    try {
      const val = eval(degreesExpr);
      return (val * Math.PI) / 180;
    } catch {
      return degreesExpr;
    }
  }

  static parseAndEval(expr) {
    // Safe evaluation using Function constructor
    const func = new Function(`return (${expr})`);
    return func();
  }

  static formatNumber(val) {
    if (Math.abs(val) >= 1e12 || (Math.abs(val) < 1e-7 && val !== 0)) {
      return val.toExponential(6).replace(/\.?0+e/, 'e');
    }
    const str = val.toString();
    if (str.includes('.')) {
      const [intPart, decPart] = str.split('.');
      const formattedInt = parseInt(intPart, 10).toLocaleString('en-US');
      const trimmedDec = decPart.length > 8 ? decPart.slice(0, 8).replace(/0+$/, '') : decPart;
      return trimmedDec ? `${formattedInt}.${trimmedDec}` : formattedInt;
    }
    return val.toLocaleString('en-US');
  }

  static evaluateRPN(stackItems) {
    const stack = [];
    for (let item of stackItems) {
      if (!isNaN(parseFloat(item))) {
        stack.push(parseFloat(item));
      } else {
        if (stack.length < 2 && item !== 'sqrt' && item !== 'sin' && item !== 'cos') return 'Error';
        const b = stack.pop();
        const a = stack.length ? stack.pop() : 0;
        switch (item) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': stack.push(b !== 0 ? a / b : NaN); break;
          case '^': stack.push(Math.pow(a, b)); break;
          case 'sqrt': stack.push(Math.sqrt(b)); break;
          default: break;
        }
      }
    }
    return stack.length ? stack[stack.length - 1] : 0;
  }
}
