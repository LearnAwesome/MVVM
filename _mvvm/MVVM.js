class MVVM {
  constructor(options) {
    const { el, data } = options;
    this.$el = el;
    this.$data = data;
    this.$watch = (expr, fn) => {
      this.watch(expr, fn);
    };
    if (this.$el) {
      // 数据劫持
      new Observer(this.$data);
      // 编译模板
      new Compile(this.$el, this);
      // 数据代理，可以使用vm.message直接获取或者设置数据
      this.proxy(this.$data);
    }
  }
  proxy(data) {
    for (const key of Object.keys(data)) {
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set(newValue) {
          data[key] = newValue;
        }
      });
    }
  }
}