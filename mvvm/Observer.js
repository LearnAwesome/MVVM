// 观察者 - 数据劫持
// 劫持数据的 getter 和 setter

class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    if (data && typeof data === 'object') { // 过滤 null 和 notObject
      for (const key of Object.keys(data)) {
        // 定义getter 和 setter
        this.defineReactive(data, key, data[key]);
        // 递归
        this.observe(data[key]);
      }
    }
  }
  defineReactive(data, key, value) {
    const _this = this;
    // 创建消息队列
    const dependence = new Dependence();
    Object.defineProperty(data, key, {
      enumerable: true, // 可枚举，可被循环到
      configurable: true, // 可配置，可以删除
      get() {
        // 当创建 watcher 时，需要存储一次旧值，会调取当前 getter
        // 存储开始，此时 getter 开始执行， Dependence.target 指向 watcher 实例
        Dependence.target && dependence.subscribe(Dependence.target);
        return value;
        // 存储结束，此时 getter 结束执行， Dependence.target 被清除
        // 以后的 getter 被调用时 Dependence.target 都为被清除状态
      },
      set(newValue) {
        if (value !== newValue) {
          // 如果设置是全新的引用，则需要重新劫持数据
          typeof newValue === 'object' && _this.observe(newValue);
          value = newValue;
          // 数据改变时，消息队列发布，触发其中所有 watcher 的更新回调函数
          dependence.publish();
        }
      }
    });
  }
}