class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
      // 将dom节点移入文档碎片中操作（更好的性能）
      const fragment = this.nodeToFragment(this.el);
      // 编译
      this.compile(fragment);
      // 将编译结果重新放回文档中
      this.el.appendChild(fragment);
    }
  }
  // core
  compileElement(node) {
    const { attributes } = node; // attributes: NamedNodeMap(ArrayLike)
    for (const attr of Array.from(attributes)) {
      const { name } = attr; // name => v-mode...
      // 只编译含有指令(v-)的属性
      if (this.isDirective(name)) {
        const { value: expr } = attr; // expr => "message.text.a"...
        const [, directive] = name.split('-'); // directive => "model"..
        const compileFn = CompileUtils.methods[directive];
        compileFn && compileFn(node, this.vm.$data, expr);
      }
    }
  }
  compileText(node) {
    const { textContent } = node; // textContent => "{{message.text.a}} 123 {{other}}"...
    const reg = CompileUtils.reg.mustache;
    if (reg.test(textContent)) {
      const compileFn = CompileUtils.methods.text;
      compileFn && compileFn(node, this.vm.$data, textContent);
    }
  }
  compile(fragment) {
    const { childNodes } = fragment;
    for (const node of Array.from(childNodes)) {
      if (this.isElementNode(node)) { // 元素节点
        this.compileElement(node);
        // 递归子元素
        this.compile(node);
      } else { // 文本节点
        this.compileText(node);
      }
    }
  }
  nodeToFragment(el) {
    const fragment = document.createDocumentFragment();
    const { childNodes } = el; // childNodes: NodeList(ArrayLike)
    for (const node of Array.from(childNodes)) {
      fragment.appendChild(node);
    }
    return fragment;
  }
  // common
  isDirective(name) { // name => 'v-model'...
    return name.startsWith('v-');
  }
  isElementNode(el) {
    return el.nodeType === 1;
  }
}

CompileUtils = {
  // 编译方案
  methods: {
    text(node, data, expr) {
      const value = CompileUtils.resolver.mixin(data, expr);
      CompileUtils.updater.text(node, value);
    },
    model(node, data, expr) {
      const value = CompileUtils.resolver.express(data, expr);
      CompileUtils.updater.input(node, value);
    },
  },
  // 更新方法
  updater: {
    text(node, value) {
      node.textContent = value;
    },
    input(node, value) {
      node.value = value;
    }
  },
  // 表达式处理器
  resolver: {
    mixin(data, expr) { // expr => "{{a}} something {{b}}"...
      return expr.replace(CompileUtils.reg.mustache, (...args) => {
        const mustache = args[0];
        return this.mustache(data, mustache);
      });
    },
    // {{}}
    mustache(data, expr) { // expr => "{{a}}"
      expr = expr.replace(CompileUtils.reg.mustache, (...args) => args[1]);
      return this.express(data, expr);
    },
    // message.a.b.c
    express(data, expr) { // expr => "message.a.b.c"...
      expr = expr.split('.');
      return expr.reduce((prev, next) => {
        return prev[next];
      }, data);
    }
  },
  // 正则
  reg: {
    // mustache {{}}
    mustache: /\{\{([^}]+)\}\}/g
  }
};