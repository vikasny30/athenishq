/**
 * OwlCalc Web Tape Store & Interop Payload State Manager
 * Manages reactive calculation tape history, downstream re-evaluation,
 * and cross-calculator Tap-to-Insert payload contract.
 */

class TapeStore {
  constructor() {
    this.nodes = this.loadSnapshot();
    this.lastInteropPayload = null;
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.saveSnapshot();
    this.subscribers.forEach(cb => cb(this.nodes, this.lastInteropPayload));
  }

  loadSnapshot() {
    try {
      const data = localStorage.getItem('owlcalc_tape_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveSnapshot() {
    try {
      localStorage.setItem('owlcalc_tape_history', JSON.stringify(this.nodes));
    } catch (err) {
      console.warn('Failed to persist tape to localStorage', err);
    }
  }

  addNode(rawExpression, rawValue, displayLabel, sourceCalculator = 'basic') {
    const node = {
      id: 'tape_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      rawExpression: rawExpression,
      rawValue: rawValue,
      displayLabel: displayLabel || String(rawValue),
      sourceCalculator: sourceCalculator,
      timestamp: Date.now()
    };

    this.nodes.unshift(node);
    if (this.nodes.length > 50) this.nodes.pop(); // Keep max 50 recent items

    // Update Interop Payload Contract
    this.lastInteropPayload = {
      rawValue: rawValue,
      displayLabel: displayLabel || String(rawValue),
      timestamp: Date.now(),
      sourceCalculator: sourceCalculator
    };

    this.notify();
    return node;
  }

  updateNode(id, newExpression) {
    const nodeIndex = this.nodes.findIndex(n => n.id === id);
    if (nodeIndex !== -1) {
      const res = MathEngine.evaluate(newExpression);
      this.nodes[nodeIndex].rawExpression = newExpression;
      this.nodes[nodeIndex].rawValue = res.rawValue;
      this.nodes[nodeIndex].displayLabel = res.displayLabel;
      this.reevaluateGraph();
      this.notify();
    }
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.notify();
  }

  clearTape() {
    this.nodes = [];
    this.lastInteropPayload = null;
    this.notify();
  }

  reevaluateGraph() {
    // Re-evaluate downstream calculations
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      if (n.rawExpression && n.sourceCalculator === 'basic') {
        const res = MathEngine.evaluate(n.rawExpression);
        n.rawValue = res.rawValue;
        n.displayLabel = res.displayLabel;
      }
    }
  }

  setLastInterop(payload) {
    this.lastInteropPayload = payload;
    this.notify();
  }
}

const windowTapeStore = new TapeStore();
