require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var reduce = require('universal-reduce')

module.exports = done

function done (acc, value, key) {
  return (
    (typeof value === 'undefined' &&
     typeof key === 'undefined') ||
    (reduce.isReduced(acc))
  )
}


},{"universal-reduce":"universal-reduce"}],2:[function(require,module,exports){
var done = require('./done')

module.exports = getStep

function getStep (type) {
  if (Array.isArray(type)) {
    return arrayStep
  }
  if (typeof type === 'string' || typeof type === 'number') {
    return addStep
  }
  if (typeof type.size === 'number') {
    if (typeof type.add === 'function') {
      return setStep
    }
    if (typeof type.set === 'function') {
      return mapStep
    }
  }
  return objectStep
}

function objectStep (acc, value, key) {
  if (done(acc, value, key)) {
    return acc
  }
  acc[key] = value
  return acc
}

function setStep (acc, value, key) {
  if (done(acc, value, key)) {
    return acc
  }
  acc.add(value)
  return acc
}

function mapStep (acc, value, key) {
  if (done(acc, value, key)) {
    return acc
  }
  acc.set(key, value)
  return acc
}

function arrayStep (acc, value, key) {
  if (done(acc, value, key)) {
    return acc
  }
  acc.push(value)
  return acc
}

function addStep (acc, value, key) {
  if (done(acc, value, key)) {
    return acc
  }
  return acc + value
}

},{"./done":1}],3:[function(require,module,exports){
var done = require('./done')
var reduce = require('universal-reduce')
var splay = require('splay')

module.exports = sort

function sort (fn) {
  return function (next) {
    var root = splay(compareor(fn))
    return function (acc, val, key) {
      if (done(acc, val, key)) {
        root.forEach(function (item) {
          if (!reduce.isReduced(acc)) {
            acc = next(acc, item.value, item.key)
          }
        })
        return next(acc)
      }
      root = root.insert({ key: key, value: val })
      return acc
    }
  }
}

function compareor (fn) {
  return function (a, b) {
    return fn(a.value, b.value, a.key, b.key)
  }
}


},{"./done":1,"splay":4,"universal-reduce":"universal-reduce"}],4:[function(require,module,exports){
var not = {
  right: 'left',
  left: 'right'
}

var empty = new SplayNode()
empty.left = empty.right = empty
SplayNode.prototype.empty = empty

if (typeof Object.freeze === 'function') {
  Object.freeze(empty)
}

module.exports = createTree

function createTree (compare) {
  if (!compare) return empty

  function SpecificSplay (value, left, right) {
    this.value = value
    this.left = left || root
    this.right = right || root
  }
  SpecificSplay.prototype = new SplayNode()
  SpecificSplay.prototype.constructor = SpecificSplay
  SpecificSplay.prototype._compare = compare

  var root = new SpecificSplay()
  root.left = root.right = root
  SpecificSplay.prototype.empty = root

  if (typeof Object.freeze === 'function') {
    Object.freeze(root)
  }

  return root
}

function SplayNode (value, left, right) {
  this.value = value
  this.left = left || empty
  this.right = right || empty
}

SplayNode.prototype._compare = defCompare

SplayNode.prototype.access = function access (item) {
  var path = this._pathTo(item)
  return this._splay(path)
}

SplayNode.prototype.find = function find (start, end, reverse) {
  if (typeof end === 'undefined') end = start
  var results = []
  var node = this.access(start)
  while (!node.isEmpty() && this._compare(end, node.value) >= 0) {
    results.push(node.value)
    node = node.right.first()
  }
  return reverse ? results.reverse() : results
}

SplayNode.prototype._pathTo = function pathTo (item) {
  var node = this
  var path = []
  var side = ''
  var comp
  path.push(node.copy())
  while (!node.isEmpty()) {
    comp = this._compare(item, node.value)
    if (comp === 0) {
      break
    }
    if (comp < 0) {
      side = 'left'
    } else {
      side = 'right'
    }
    node = node[side]
    if (node.isEmpty()) {
      break
    }
    path.push(side)
    path.push(node.copy())
  }
  return path
}

SplayNode.prototype.insert = function insert (item) {
  return this._splay(this._place(new this.constructor(item)))
}

SplayNode.prototype.remove = function remove (item) {
  var path = this._pathTo(item)
  var len = path.length
  var node = path.pop()
  var last = node.left.join(node.right)
  if (len === 1) return last
  return this._splay(this._pluck(item))
}

SplayNode.prototype.forEach = function forEach (cb) {
  var idx = 0
  var tree = this.first()
  while (!tree.isEmpty()) {
    cb(tree.value, idx++)
    tree = tree.right.first()
  }
}

SplayNode.prototype.join = function join (right) {
  var left = this
  if (left.isEmpty()) {
    return right
  }
  var result = this._splay(left._highest())
  result.right = right
  return result
}

SplayNode.prototype.split = function (item) {
  var more = this.access(item)
  var less = more.left
  more.left = this.empty
  return [ less, more ]
}

SplayNode.prototype.uInsert = function (item) {
  if (this.isEmpty()) return this.insert(item)
  var root = this.access(item)
  if (!root.isEmpty() && this._compare(item, root.value) === 0) {
    root.value = item
    return root
  } else {
    return this.insert(item)
  }
}

SplayNode.prototype.isEmpty = function isEmpty () {
  return (this === this.right && this === this.left)
}

SplayNode.prototype.first = function first () {
  if (this.left.isEmpty()) {
    return this
  }
  return this._splay(this._lowest())
}

SplayNode.prototype.last = function last () {
  if (this.right.isEmpty()) {
    return this
  }
  return this._splay(this._highest())
}

SplayNode.prototype.unshift = function unshift (item) {
  var path = this._lowest()
  path.push('left')
  path.push(new this.constructor(item))
  return this._splay(path)
}

SplayNode.prototype.shift = function shift () {
  return this._splay(this._lowest()).right
}

SplayNode.prototype.pop = function pop () {
  return this._splay(this._highest()).left
}

SplayNode.prototype.push = function push (item) {
  var path = this._highest()
  path.push('right')
  path.push(new this.constructor(item))
  return this._splay(path)
}

SplayNode.prototype._splay = function _splay (path) {
  var newRoot = path.pop()
  var par
  var gp
  var tmp
  var first
  var second
  while (true) {
    second = path.pop()
    par = path.pop()
    if (!par) break
    first = path.pop()
    gp = path.pop()
    tmp = newRoot[not[second]]
    newRoot[not[second]] = par
    par[second] = tmp
    if (first === second) {
      tmp = par[not[first]]
      par[not[first]] = gp
      gp[first] = tmp
    } else if (first === not[second]) {
      tmp = newRoot[not[first]]
      newRoot[not[first]] = gp
      gp[first] = tmp
    }
  }

  return newRoot
}

SplayNode.prototype._place = function _place (toInsert) {
  var path = []
  var side = ''
  var node = this
  while (!node.isEmpty()) {
    path.push(node.copy())
    if (this._compare(toInsert.value, node.value) < 0) {
      side = 'left'
    } else {
      side = 'right'
    }
    node = node[side]
    path.push(side)
  }
  path.push(toInsert)
  return path
}

SplayNode.prototype._pluck = function _pluck (toDelete) {
  var node = this
  var path = []
  var side = ''
  while (!node.isEmpty()) {
    path.push(node.copy())
    if (this._compare(toDelete, node.value) < 0) {
      side = 'left'
    } else {
      side = 'right'
    }
    node = node[side]
    if (toDelete === node.value) {
      break
    }
    path.push(side)
  }
  path[path.length - 1][side] = node.left.join(node.right)
  return path
}

SplayNode.prototype.copy = function copy () {
  return new this.constructor(this.value, this.left, this.right)
}

SplayNode.prototype._higher = function _higher () {
  var path = [this.copy(), 'right']
  var node = this.right
  if (node.isEmpty()) return this
  path.push(this.right.copy())
  return node._lowest(path)
}

SplayNode.prototype._lower = function _lower () {
  var path = [this.copy(), 'left']
  var node = this.left
  if (node.isEmpty()) return path
  return node._highest(path)
}

SplayNode.prototype._highest = function _highest (path) {
  var node = this
  path || (path = [])
  path.push(this.copy())
  while (!node.right.isEmpty()) {
    node = node.right
    path.push('right')
    path.push(node.copy())
  }
  return path
}

SplayNode.prototype._lowest = function _lowest (path) {
  path || (path = [ this.copy() ])
  var node = path[path.length - 1]
  while (!node.left.isEmpty()) {
    node = node.left
    path.push('left')
    path.push(node.copy())
  }
  return path
}

function defCompare (a, b) {
  var stringA = String(a)
  var stringB = String(b)
  if (stringA === stringB) {
    return 0
  }
  return stringA > stringB ? 1 : -1
}


},{}],"photocopy":[function(require,module,exports){
var reduce = require('universal-reduce')

var getStep = require('./get-step')
var done = require('./done')
var sort = require('./sort')

var basic = {
  'string': true,
  'number': true,
  'boolean': true,
  'symbol': true,
  'function': true
}

module.exports = photocopy

function photocopy (original, tx, seed, step) {
  return reduce.unwrap(_photocopy(original, tx, seed, step))
}

function _photocopy (original, tx, seed, step) {
  if (typeof tx !== 'function') tx = identity
  if (typeof seed === 'undefined') {
    seed = new (original.constructor || Object)
  }
  if (typeof step !== 'function') step = getStep(seed)
  // Initialize transducer
  var transducer = tx(step)

  return transducer(reduce._reduce(original, transducer, seed))
}

function identity (next) {
  return next
}

function cat (next) {
  return function (acc, value, key) {
    if (done(acc, value, key)) {
      return next.apply(null, arguments)
    }
    return photocopy(value, identity, acc, next)
  }
}

function steamroll (next) {
  return function inner (acc, value, key) {
    if (done(acc, value, key)) {
      return next.apply(null, arguments)
    }
    if (value == null || typeof value in basic) return next(acc, value, key)
    return photocopy(value, identity, acc, inner)
  }
}

var filter = simple(function (fn, next, acc, val, key) {
  return fn(val, key) ? next(acc, val, key) : acc
})

var map = simple(function (fn, next, acc, val, key) {
  return next(acc, fn(val, key), key)
})

var keyMap = simple(function (fn, next, acc, val, key) {
  return next(acc, val, fn(val, key))
})

function take (n) {
  return function (next) {
    var i = 0
    return function (acc, val, key) {
      if (done(acc, val, key)) {
        return next.apply(null, arguments)
      }
      if (i >= n) return acc
      i += 1
      return next(acc, val, key)
    }
  }
}

function skip (n) {
  return function (next) {
    var i = 0
    return function (acc, val, key) {
      if (done(acc, val, key)) {
        return next.apply(null, arguments)
      }
      if (i >= n) return next(acc, val, key)
      i += 1
      return acc
    }
  }
}

function cond (condition, ifTrue, ifFalse) {
  ifFalse = ifFalse != null ? ifFalse : identity

  return function (next) {
    next = condNextWrapper(next)
    ifTrue = ifTrue(next)
    ifFalse = ifFalse(next)

    return function (acc, val, key) {
      if (done(acc, val, key)) {
        return ifFalse(ifTrue(acc, val, key))
      }
      var fn = condition(val, key) ? ifTrue : ifFalse
      return fn(acc, val, key)
    }
  }
}

function condNextWrapper (next) {
  var isFirstBranch = true

  return function (acc, val, key) {
    if (done(acc, val, key) && isFirstBranch) {
      isFirstBranch = false
      return acc
    }

    return next(acc, val, key)
  }
}

photocopy({
  identity: identity,
  cat: cat,
  steamroll: steamroll,
  simple: simple,
  filter: filter,
  map: map,
  keyMap: keyMap,
  reduced: reduce.reduced,
  byKey: byKey,
  cond: cond,
  comp: comp,
  done: done,
  take: take,
  skip: skip,
  sort: sort,
  _photocopy: _photocopy
}, identity, photocopy)

function byKey (acc, value, key) {
  if (done(acc, value, key)) {
    return acc
  }
  var arr = acc[key] || (acc[key] = [])
  arr.push(value)
  return acc
}

function simple (setup) {
  return function (fn) {
    return function (next) {
      // setup state here
      return function (acc, val, key) {
        if (done(acc, val, key)) {
          return next.apply(null, arguments)
        }
        return setup(fn, next, acc, val, key)
      }
    }
  }
}

function comp () {
  return photocopy(arguments, identity, null, fnStep)
}

function fnStep (acc, value, key) {
  if (acc == null) return value
  if (done(acc, value, key)) {
    return acc
  }
  return function (next) {
    return acc(value(next))
  }
}


},{"./done":1,"./get-step":2,"./sort":3,"universal-reduce":"universal-reduce"}],"universal-reduce":[function(require,module,exports){
var has = Object.prototype.hasOwnProperty
var toString = Object.prototype.toString
var enumerable = Object.prototype.propertyIsEnumerable
var hasSymbol = typeof Symbol === 'function'

reduce.reduced = Reduced
reduce.isReduced = isReduced
reduce.unwrap = unwrap
reduce._reduce = _reduce

module.exports = reduce

function reduce (stuff, fn, acc) {
  return unwrap(_reduce(stuff, fn, acc))
}

function _reduce (stuff, fn, acc) {
  if (!stuff) return acc
  if (toString.call(stuff) === '[object Map]') {
    return reduceMap(stuff, fn, acc)
  }
  if (hasSymbol && Symbol.iterator && stuff[Symbol.iterator]) {
    return reduceIt(stuff[Symbol.iterator](), fn, acc)
  }
  return reduceObj(stuff, fn, acc)
}

function reduceObj (obj, fn, acc) {
  var next = acc
  for (var i in obj) {
    if (has.call(obj, i)) {
      next = fn(next, obj[i], i)
      if (isReduced(next)) return next
    }
  }
  if (typeof Object.getOwnPropertySymbols === 'function') {
    var symbols = Object.getOwnPropertySymbols(obj)
    var key
    for (var j = 0; j < symbols.length; j++) {
      key = symbols[j]
      if (enumerable.call(obj, key)) {
        next = fn(next, obj[key], key)
        if (isReduced(next)) return next
      }
    }
  }
  return next
}

function reduceIt (it, fn, acc) {
  var inserted = 0
  var step = null
  var next = acc
  while (true) {
    step = it.next()
    if (step.done) break;
    next = fn(next, step.value, '' + inserted++)
    if (isReduced(next)) return next
  }
  return next
}

function reduceMap (map, fn, acc) {
  var step = null
  var next = acc
  var it = map.entries()
  while (true) {
    step = it.next()
    if (step.done) break;
    next = fn(next, step.value[1], step.value[0])
    if (isReduced(next)) return next
  }
  return next
}

function Reduced (val) {
  return {
    '@@transducer/reduced': true,
    '@@transducer/value': val
  }
}

function unwrap (val) {
  while (isReduced(val)) {
    val = val['@@transducer/value']
  }
  return val
}

function isReduced (val) {
  if (val == null) return false
  return val['@@transducer/reduced'] === true
}

},{}]},{},[]);
