// 订阅 - 发布
// 在定义响应式数据时，对每个数据都添加一个队列

class Dependence {
  constructor() {
    // 队列
    this.queue = [];
  }
  subscribe(watcher) {
    // 在数据的 getter 中，将 watcher 添加至该数据的消息队列中
    watcher && this.queue.push(watcher);
  }
  publish() {
    // 在数据的 setter 中，调用其消息队列中所有 watcher 的更新方法
    for (const watcher of this.queue) {
      watcher.update();
    }
  }
}