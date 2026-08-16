/**
 * OwlCalc Web Specialized Utility Calculators Engine
 * Implements Currency, Unit Conversion, Tip/Split, Discount, Date, BMI, Loan,
 * Programmer, RPN, Smart Notes, and Receipt Generator.
 */

const CURRENCY_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.4,
  CAD: 1.36,
  AUD: 1.51,
  INR: 83.5,
  CHF: 0.91,
  CNY: 7.23,
  MXN: 16.8,
  BRL: 5.15,
  KRW: 1360.0
};

const UNIT_CONVERSIONS = {
  length: {
    m: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    ft: 0.3048,
    in: 0.0254,
    mi: 1609.34,
    yd: 0.9144
  },
  weight: {
    kg: 1,
    g: 0.001,
    mg: 0.000001,
    lb: 0.453592,
    oz: 0.0283495,
    st: 6.35029
  },
  temperature: {
    // Special handling in code for C, F, K
  },
  area: {
    sqm: 1,
    sqkm: 1000000,
    sqft: 0.092903,
    acre: 4046.86,
    hectare: 10000
  },
  speed: {
    mps: 1,
    kmh: 0.277778,
    mph: 0.44704,
    knot: 0.514444
  }
};

class OwlCalculators {
  // Currency Conversion
  static convertCurrency(amount, from, to) {
    const amt = parseFloat(amount) || 0;
    const rateFrom = CURRENCY_RATES[from] || 1;
    const rateTo = CURRENCY_RATES[to] || 1;
    const inUSD = amt / rateFrom;
    const converted = inUSD * rateTo;
    return {
      converted: MathEngine.formatNumber(Number(converted.toFixed(4))),
      rawValue: converted,
      displayLabel: `${from === 'USD' || from === 'CAD' ? '$' : ''}${amt} ${from} = ${converted.toFixed(2)} ${to}`
    };
  }

  // Unit Conversion
  static convertUnit(amount, category, fromUnit, toUnit) {
    const amt = parseFloat(amount) || 0;
    if (category === 'temperature') {
      let valInCelsius = amt;
      if (fromUnit === 'F') valInCelsius = (amt - 32) * (5 / 9);
      if (fromUnit === 'K') valInCelsius = amt - 273.15;

      let res = valInCelsius;
      if (toUnit === 'F') res = (valInCelsius * 9 / 5) + 32;
      if (toUnit === 'K') res = valInCelsius + 273.15;
      
      return {
        converted: res.toFixed(2),
        rawValue: res,
        displayLabel: `${amt}°${fromUnit} = ${res.toFixed(2)}°${toUnit}`
      };
    }

    const catObj = UNIT_CONVERSIONS[category];
    if (!catObj || !catObj[fromUnit] || !catObj[toUnit]) {
      return { converted: '0', rawValue: 0, displayLabel: '0' };
    }

    const baseVal = amt * catObj[fromUnit];
    const converted = baseVal / catObj[toUnit];
    return {
      converted: MathEngine.formatNumber(Number(converted.toFixed(4))),
      rawValue: converted,
      displayLabel: `${amt} ${fromUnit} = ${converted.toFixed(2)} ${toUnit}`
    };
  }

  // Tip & Split Calculator
  static calculateTip(bill, tipPercent, splitCount) {
    const b = parseFloat(bill) || 0;
    const tPct = parseFloat(tipPercent) || 0;
    const pCount = Math.max(1, parseInt(splitCount, 10) || 1);

    const tipAmount = b * (tPct / 100);
    const grandTotal = b + tipAmount;
    const perPerson = grandTotal / pCount;

    return {
      tipAmount: tipAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      perPerson: perPerson.toFixed(2),
      rawValue: perPerson,
      displayLabel: `$${perPerson.toFixed(2)} / person (Total $${grandTotal.toFixed(2)})`
    };
  }

  // Discount Calculator
  static calculateDiscount(price, discountPct, taxPct) {
    const p = parseFloat(price) || 0;
    const dPct = parseFloat(discountPct) || 0;
    const tPct = parseFloat(taxPct) || 0;

    const discountVal = p * (dPct / 100);
    const discountedPrice = p - discountVal;
    const taxVal = discountedPrice * (tPct / 100);
    const finalTotal = discountedPrice + taxVal;
    const totalSavings = discountVal;

    return {
      discountVal: discountVal.toFixed(2),
      discountedPrice: discountedPrice.toFixed(2),
      taxVal: taxVal.toFixed(2),
      finalTotal: finalTotal.toFixed(2),
      totalSavings: totalSavings.toFixed(2),
      rawValue: finalTotal,
      displayLabel: `$${finalTotal.toFixed(2)} (Saved $${totalSavings.toFixed(2)})`
    };
  }

  // Date Calculator
  static calculateDateDiff(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return { days: 0, weeks: 0, label: 'Select dates' };
    const d1 = new Date(startDateStr);
    const d2 = new Date(endDateStr);
    const diffMs = Math.abs(d2 - d1);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;

    return {
      days: diffDays,
      weeks: weeks,
      remDays: remDays,
      displayLabel: `${diffDays} Days (${weeks} weeks, ${remDays} days)`
    };
  }

  // BMI Calculator
  static calculateBMI(heightCm, weightKg) {
    const hM = (parseFloat(heightCm) || 0) / 100;
    const w = parseFloat(weightKg) || 0;
    if (hM <= 0 || w <= 0) return { bmi: '0', category: 'Invalid Input', color: '#94A3B8' };

    const bmi = w / (hM * hM);
    let category = 'Normal';
    let color = '#10B981'; // Green

    if (bmi < 18.5) {
      category = 'Underweight';
      color = '#3B82F6';
    } else if (bmi >= 25 && bmi < 29.9) {
      category = 'Overweight';
      color = '#F59E0B';
    } else if (bmi >= 30) {
      category = 'Obese';
      color = '#EF4444';
    }

    return {
      bmi: bmi.toFixed(1),
      category: category,
      color: color,
      rawValue: Number(bmi.toFixed(1)),
      displayLabel: `BMI ${bmi.toFixed(1)} (${category})`
    };
  }

  // Loan Calculator
  static calculateLoan(principal, annualRate, termYears) {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(annualRate) || 0) / 100 / 12;
    const n = (parseFloat(termYears) || 0) * 12;

    if (p <= 0 || r <= 0 || n <= 0) {
      return { monthlyPayment: '0.00', totalInterest: '0.00', totalPaid: '0.00' };
    }

    const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPaid = monthly * n;
    const totalInterest = totalPaid - p;

    return {
      monthlyPayment: monthly.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      rawValue: Number(monthly.toFixed(2)),
      displayLabel: `$${monthly.toFixed(2)}/mo ($${totalInterest.toFixed(2)} interest)`
    };
  }

  // Programmer Mode Conversion
  static convertProgrammer(valInput, fromBase = 'DEC') {
    let num = 0;
    try {
      if (fromBase === 'DEC') num = parseInt(valInput, 10) || 0;
      if (fromBase === 'HEX') num = parseInt(valInput, 16) || 0;
      if (fromBase === 'BIN') num = parseInt(valInput, 2) || 0;
      if (fromBase === 'OCT') num = parseInt(valInput, 8) || 0;
    } catch {
      num = 0;
    }

    return {
      dec: num.toString(10),
      hex: num.toString(16).toUpperCase(),
      bin: num.toString(2).padStart(8, '0'),
      oct: num.toString(8)
    };
  }

  // Generate Styled Receipt HTML Canvas / Data URL
  static generateReceiptCardData(title, items, total, date = new Date().toLocaleDateString()) {
    return {
      brand: 'OwlCalc Pro Receipt',
      title: title,
      date: date,
      items: items,
      total: total,
      barcode: '||| | |||| | ||||| || |'
    };
  }
}
