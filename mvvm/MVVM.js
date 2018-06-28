class MVVM {
  constructor(options) {
    const { el, data } = options;
    this.$el = el;
    this.$data = data;
    if (this.$el) {
      // 编译模板：将html中的指令及插值替换为具体的值
      new Compile(this.$el, this.$data);
    }
  }
}