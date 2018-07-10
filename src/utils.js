// utils.js
export function trace(msg) {
  if (typeof (window) == 'undefined' || !window.console) return
  let len = arguments.length
  let args = []
  for (let i = 0; i < len; i++) args.push("arguments[" + i + "]")
  eval("console.log(" + args.join(",") + ")")
}

export function dirname(path) {
  let pth = path.replace(/^\/?(.*?)\/?$/, "$1").split('/')
  pth.pop()
  return "/" + pth.join("/")
}

export function basename(path) {
  // let pth = path.replace(/^\//,'').split('/')
  let pth = path.replace(/^\/?(.*?)\/?$/, "$1").split('/')

  let base = pth.pop()
  if (base == "") return null
  else return base
}

let _ordinalize_re = /(\d)(?=(\d\d\d)+(?!\d))/g
export function ordinalize(num) {
  let norm = "" + num
  if (num < 11000) {
    norm = ("" + num).replace(_ordinalize_re, "$1,")
  } else if (num < 1000000) {
    norm = Math.floor(num / 1000) + "k"
  } else if (num < 1000000000) {
    norm = ("" + Math.floor(num / 1000)).replace(_ordinalize_re, "$1,") + "m"
  }
  return norm
}

/* Nano Templates (Tomasz Mazur, Jacek Becela) */
export function nano(template, data) {
  return template.replace(/\{([\w\-\.]*)}/g, function (str, key) {
    let keys = key.split("."),
      value = data[keys.shift()];
    keys.forEach(function () {
      if (value.hasOwnProperty(this)) value = value[this]
      else value = str
    })
    return value
  })
}

export function objcopy(old) {
  if (old === undefined) return undefined
  if (old === null) return null

  if (old.parentNode) return old
  switch (typeof old) {
    case "string":
      return old.substring(0)
      break

    case "number":
      return old + 0
      break

    case "boolean":
      return old === true
      break
  }

  let newObj = isArray(old) ? [] : {}
  for (let i in old) {
    newObj[i] = objcopy(old[i])
  }
  return newObj
}

function isArray(obj) {
  return Object.prototype.toString.apply(obj).indexOf('Array') > -1
}

export function objmerge(dst, src) {
  dst = dst || {}
  src = src || {}
  let merge = objcopy(dst)
  for (let k in src) merge[k] = src[k]
  return merge
}

export function objcmp(a, b, strict_ordering) {
  if (!a || !b) return a === b // handle null+undef
  if (typeof a != typeof b) return false // handle type mismatch
  if (typeof a != 'object') {
    // an atomic type
    return a === b
  } else {
    // a collection type

    // first compare buckets
    if (isArray(a)) {
      if (!isArray(b)) return false
      if (a.length != b.length) return false
    } else {
      let a_keys = [];
      for (let k in a)
        if (a.hasOwnProperty(k)) a_keys.push(k)
      let b_keys = [];
      for (let k in b)
        if (b.hasOwnProperty(k)) b_keys.push(k)
      if (!strict_ordering) {
        a_keys.sort()
        b_keys.sort()
      }
      if (a_keys.join(',') !== b_keys.join(',')) return false
    }

    // then compare contents
    let same = true

    for (let ik in a) {
      let diff = objcmp(a[ik], b[ik])
      same = same && diff
      if (!same) return false
    }
    return same
  }
}

export function objkeys(obj) {
  return Object.keys(obj);
}

export function objcontains(obj) {
  if (!obj || typeof obj != 'object') return false
  for (let i = 1, j = arguments.length; i < j; i++) {
    if (obj.hasOwnProperty(arguments[i])) return true
  }
  return false
}

export function uniq(arr) {
  // keep in mind that this is only sensible with a list of strings
  // anything else, objkey type coercion will turn it into one anyway
  let len = arr.length
  let set = {}
  for (let i = 0; i < len; i++) {
    set[arr[i]] = true
  }

  return objkeys(set)
}

export function arbor_path() {
  let scripts = document.querySelectorAll('script');
  let candidates = [];
  for (let i = 0; i < scripts.length; i++) {
    let el = scripts[i];
    let src = el.getAttribute('src');
    if (src && src.match(/arbor[^\/\.]*.js|dev.js/)) {
      candidates.push(src.match(/.*\//) || "/")
    }
  }
  if (candidates.length > 0) return candidates[0]
  else return null
}

export function each(obj, callback) {
  if (isArray(obj)) {
    for (let i = 0, j = obj.length; i < j; i++) callback(i, obj[i])
  } else {
    for (let k in obj) callback(k, obj[k])
  }
}

export function isArray(obj) {
  return Object.prototype.toString.call(obj).indexOf('Array') > -1;
}

export function inArray(elt, arr) {
  for (let i = 0, j = arr.length; i < j; i++)
    if (arr[i] === elt) return i;
  return -1
}

export function getOffset(element) {
  let offest = {
    top: 0,
    left: 0
  };

  let _position;

  _getOffset(element, true);

  return offest;

  function _getOffset(node, init) {
    // 非Element 终止递归
    if (node.nodeType !== 1) {
      return;
    }
    _position = window.getComputedStyle(node)['position'];

    // position=static: 继续递归父节点
    if (typeof (init) === 'undefined' && _position === 'static') {
      _getOffset(node.parentNode);
      return;
    }
    offest.top = node.offsetTop + offest.top - node.scrollTop;
    offest.left = node.offsetLeft + offest.left - node.scrollLeft;

    // position = fixed: 获取值后退出递归
    if (_position === 'fixed') {
      return;
    }
    _getOffset(node.parentNode);
  }
}