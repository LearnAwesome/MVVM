class Compile {
  constructor(el, data) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.data = data;
    if (this.data) {
      /* 编译过程
      * 1. 将目标el节点全部放入文档碎片(内存中) nodeToFragment
      * 2. 执行编译，编译文档碎片中的节点 compile
      * 3. 将文档碎片中的节点重新添加回目标el中 fragmentToNode
      */
      const fragment = this.nodeToFragment(this.el);
      this.compile(fragment);
      this.fragmentToNode(fragment);
    }
  }
  // core
  compileElementNode(node) {
    for (const attr of [...node.attributes]) {
      const { name } = attr;
      if (this.isDirection(name)) {
        const [, direction] = name.split('-');
        const { value: expr } = attr;
        // node direction:model expr:message.a this.data
        const compileFn = CompileUtils.method[direction];
        compileFn && compileFn(node, expr, this.data);
      }
    }
  }
  compileTextNode(node) {
    const { textContent } = node;
    const reg = /\{\{([^\}]+)\}\}/g;
    textContent.replace(reg, (...args) => {
      const expr = args[1];
      // node "text" expr this.data
      // console.log(expr);
      const compileFn = CompileUtils.method['text'];
      compileFn && compileFn(node, expr, this.data);
    });
  }
  compile(fragment) {
    for (const node of [...fragment.childNodes]) {
      if (this.isElementNode(node)) {
        this.compileElementNode(node);
        this.compile(node);
      } else {
        this.compileTextNode(node);
      }
    }
  }

  // common
  isDirection(attr) {
    return attr.startsWith('v-');
  }
  fragmentToNode(fragment) {
    this.el.appendChild(fragment);
  }
  nodeToFragment(el) {
    const fragment = document.createDocumentFragment();
    for (const node of [...el.childNodes]) {
      fragment.appendChild(node);
    }
    return fragment;
  }
  isElementNode(node) {
    return node.nodeType === 1;
  }
}

const CompileUtils = {
  method: {
    model(node, expr, data) {
      const value = CompileUtils.resolver.express(expr, data);
      CompileUtils.updater.input(node, value);
    },
    text(node, expr, data) {
      const value = CompileUtils.resolver.express(expr, data);
      CompileUtils.updater.text(node, value);
    }
  },
  resolver: {
    express(expr, data) {
      expr = expr.split('.');
      return expr.reduce((prev, next) => {
        return prev[next];
      }, data);
    }
  },
  updater: {
    input(node, value) {
      node.value = value;
    },
    text(node, value) {
      node.textContent = value;
    }
  }
}