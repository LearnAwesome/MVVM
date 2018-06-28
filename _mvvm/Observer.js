class Observer {
  constructor(data) {
    this.data = data;
    this.observe(this.data);
  }
  observe(data) {
    if (data && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        this.defineReactive(data, key, data[key]);
        this.observe(data[key]);
      }
    }
  }
  defineReactive(data, key, value) {
    const _this = this;
    const dependence = new Dependence();
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        Dependence.target && dependence.subscribe(Dependence.target);
        return value;
      },
      set(newValue) {
        if (newValue !== value) {
          typeof newValue === 'object' && _this.observe(newValue);
          value = newValue;
          dependence.publish();
        }
      }
    });
  }
}