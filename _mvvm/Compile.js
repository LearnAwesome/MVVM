class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
      const fragment = this.nodeToFragment(this.el);
      this.compile(fragment);
      this.el.appendChild(fragment);
    }
  }
  // core
  compileElement(node) {
    const { attributes } = node;
    for (const attr of [...attributes]) {
      const { name, value: expr } = attr;
      if (this.isDirective(name)) {
        const [, directive] = name.split('-');
        const compileMethod = CompileUtil.method[directive];
        compileMethod && compileMethod(node, this.vm.$data, expr);
        new Watcher(this.vm, expr, () => {
          compileMethod && compileMethod(node, this.vm.$data, expr);
        });
        if (this.isInputNode(node)) {
          node.addEventListener('input', (e) => {
            CompileUtil.resolver.express(this.vm.$data, expr, e.target.value);
          })
        }
      }
    }
  }
  compileText(node) {
    const { textContent } = node;
    const compileMethod = CompileUtil.method['text'];
    compileMethod && compileMethod(node, this.vm.$data, textContent);
    textContent.replace(CompileUtil.reg.mustache, (...args) => {
      const expr = args[1];
      new Watcher(this.vm, expr, () => {
        compileMethod && compileMethod(node, this.vm.$data, textContent);
      });
    });
  }
  compile(fragment) {
    const { childNodes } = fragment;
    for (const node of [...childNodes]) {
      if (this.isElementNode(node)) {
        this.compileElement(node);
        this.compile(node);
      } else {
        this.compileText(node);
      }
    }
  }
  nodeToFragment(node) {
    const fragment = document.createDocumentFragment();
    const { childNodes } = node;
    for (const node of [...childNodes]) {
      fragment.appendChild(node);
    }
    return fragment;
  }
  // common
  isInputNode(node) {
    return node.tagName.toLowerCase() === 'input';
  }
  isDirective(attrName) {
    return attrName.startsWith('v-');
  }
  isElementNode(node) {
    return node.nodeType === 1;
  }
}

const CompileUtil = {
  method: {
    model(node, data, expr) {
      const value = CompileUtil.resolver.express(data, expr);
      CompileUtil.updater.input(node, value);
    },
    text(node, data, expr) {
      const value = CompileUtil.resolver.text(data, expr);
      CompileUtil.updater.text(node, value);
    }
  },
  resolver: {
    express(data, expr, value) {
      expr = expr.split('.');
      return expr.reduce((prev, next, currentIndex) => {
        if (value && currentIndex === expr.length - 1) {
          return prev[next] = value;
        } else {
          return prev[next];
        }
      }, data);
    },
    text(data, expr) {
      return this.mustache(data, expr);
    },
    mustache(data, expr) {
      return expr.replace(CompileUtil.reg.mustache, (...args) => {
        return this.express(data, args[1]);
      });
    }
  },
  updater: {
    input(node, value) {
      node.value = value;
    },
    text(node, value) {
      node.textContent = value;
    }
  },
  reg: {
    mustache: /\{\{([^}]+)\}\}/g
  }
};