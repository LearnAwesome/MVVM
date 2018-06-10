// 观察者 - 只在数据更新时作用
// 更新dom

class Watcher {
  constructor(vm, expr, callback) {
    Object.assign(this, {vm, expr, callback});
    // 在创建 watcher 实例时，消息队列的 target 属性瞬间指向 watcher 实例
    Dependence.target = this;
    // 储存旧值
    this.oldValue = this.getValue(vm, expr);
    // 在创建储存旧值结束时，消息队列的 target 属性被清空
    // 这样能确保：1.一个数据对应一个消息队列 2.每个消息队列中可以包括多个 watcher
    Dependence.target = null;
  }
  update() {
    const newValue = this.getValue(this.vm, this.expr);
    const { oldValue } = this;
    if (newValue !== oldValue) {
      this.callback && this.callback(newValue, oldValue);
    }
  }
  getValue(vm, expr) {
    return CompileUtils.resolver.express(vm.$data, expr);
  }
}