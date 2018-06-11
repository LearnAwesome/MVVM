class Dependence {
  constructor() {
    this.queue = [];
  }
  subscribe(watcher) {
    watcher && this.queue.push(watcher);
  }
  publish() {
    for (const watcher of this.queue) {
      watcher.update && watcher.update();
    }
  }
}