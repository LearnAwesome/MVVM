class MVVM {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    if (this.$el) {
      new Observer(this.$data);
      new Compile(this.$el, this);
      this.proxy(this, this.$data);
    }
  }
  proxy(vm, data) {
    if (data) {
      for (const key of Object.keys(data)) {
        Object.defineProperty(vm, key, {
          get() {
            return data[key];
          },
          set(newValue) {
            if (data[key] !== newValue) {
              data[key]= newValue;
            }
          }
        });
      }
    }
  }
}