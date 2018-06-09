class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    if (!data || typeof data !== 'object') {
      return;
    }
    for (const key of Object.keys(data)) {
      this.defineReactive(data, key, data[key]);
      this.observe(data[key]);
    }
  }
  defineReactive(data, key, value) {
    const _this = this;
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        return value;
      },
      set(newValue) {
        if (value !== newValue) {
          _this.observe(newValue);
          value = newValue;
        }
      }
    });
  }
}