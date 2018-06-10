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

        // 创建观察者
        // 当数据改变时，重新编译相应节点
        new Watcher(this.vm, expr, () => {
          compileFn && compileFn(node, this.vm.$data, expr);
        });

        // 第一次编译时，替换表达式为具体的值
        compileFn && compileFn(node, this.vm.$data, expr);

        // input输入时，更新数据
        if (node.tagName.toLowerCase() === 'input') {
          node.addEventListener('input', e => {
            const value = e.target.value;
            CompileUtils.resolver.express(this.vm.$data, expr, value);
          });
        }
      }
    }
  }
  compileText(node) {
    const { textContent } = node; // textContent => "{{message.text.a}} 123 {{other}}"...
    const reg = CompileUtils.reg.mustache;
    if (reg.test(textContent)) {
      // test方法前的正则如果含有全局配属性，lastIndex会记忆，清除保证其他地方test方法正常运行
      reg.lastIndex = 0;
      const compileFn = CompileUtils.methods.text;

      // 创建观察者
      // 当数据改变时，重新编译相应节点
      // 文本节点有可能是 {{message.a}} asd {{other}} 
      textContent.replace(CompileUtils.reg.mustache, (...args) => {
        const expr = args[1];
        // 每个 mustache 创建一个 watcher
        new Watcher(this.vm, expr, () => {
          // 每当任意一个 mustache 改变时，更新全部文本节点的内容 textContent
          compileFn && compileFn(node, this.vm.$data, textContent);
        });
      });

      // 第一次编译时，替换表达式为具体的值
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
    mustache(data, expr) { // expr => "{{a}}"
      expr = expr.replace(CompileUtils.reg.mustache, (...args) => args[1]);
      return this.express(data, expr);
    },
    express(data, expr, value) { // expr => "message.a.b.c"...
      expr = expr.split('.');
      // 收敛
      return expr.reduce((prev, next, currentIndex) => {
        if (value && currentIndex === expr.length - 1) {
          return prev[next] = value;
        } else {
          return prev[next];
        }
      }, data);
    }
  },
  // 正则
  reg: {
    // mustache {{}}
    mustache: /\{\{([^}]+)\}\}/g
  }
};