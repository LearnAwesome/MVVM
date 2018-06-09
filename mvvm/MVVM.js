// import { Compile } from './Compile';

class MVVM {
  constructor(options) {
    const { el, data } = options;
    this.$el = el;
    this.$data = data;
    if (this.$el) {
      // 编译模板
      new Compile(this.$el, this);
    }
  }
}