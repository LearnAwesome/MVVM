class Watcher {
  constructor(vm, expr, callback) {
    this.vm = vm;
    this.expr = expr;
    this.callback = callback;
    Dependence.target = this;
    this.oldValue = this.getValue(this.vm.$data, this.expr);
    Dependence.target = null;
  }
  update() {
    const newValue = this.getValue(this.vm.$data, this.expr);
    if (newValue !== this.oldValue) {
      this.callback && this.callback();
    }
  }
  getValue(data, expr) {
    return CompileUtil.resolver.express(data, expr);
  }
}