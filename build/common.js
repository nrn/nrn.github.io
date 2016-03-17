require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    var root = splay.empty
    var sortBy = compareor(fn)
    return function (acc, val, key) {
      if (done(acc, val, key)) {
        root.forEach(function (item) {
          if (!reduce.isReduced(acc)) {
            acc = next(acc, item.value, item.key)
          }
        })
        return next(acc)
      }
      root = root.insert({ key: key, value: val }, sortBy)
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

var empty = new Node ()
empty.left = empty
empty.right = empty

if (typeof Object.freeze === 'function') {
  Object.freeze(empty)
}

createTree.Node = Node
createTree.empty = empty
module.exports = createTree

function createTree (value) {
  if (typeof value === 'undefined') {
    return empty
  }
  return new Node(value)
}

function Node (value, left, right) {
  this.value = value
  this.left = left || empty
  this.right = right || empty
}

Node.prototype.insert = function insert (item, fn) {
  return splay(this.place(new Node(item), fn))
}

Node.prototype.remove = function remove (item, fn) {
  return splay(this.pluck(item, fn))
}

Node.prototype.forEach = function forEach (cb) {
  var idx = 0
  tree = this.first()
  cb(tree.value, idx++)

  tree = tree.right
  while (tree !== empty) {
    tree = tree.first()
    cb(tree.value, idx++)
    tree = tree.right
  }
}

function splay (path) {
  if (!path) return empty
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

Node.prototype.place = function place (toInsert, compare) {
  var path = []
  var side = ''
  var node = this
  while (node !== empty) {
    path.push(node.copy())
    if (compare(toInsert.value, node.value) < 0) {
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

Node.prototype.pluck = function pluck (toDelete, compare) {
  var node = this
  var path = []
  var side = ''
  while (node !== empty) {
    path.push(node.copy())
    if (compare(toDelete, node.value) < 0) {
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
  path[path.length -1][side] = node.left.join(node.right)
  return path
}

Node.prototype.join = function join (right) {
  var left = this
  if (left === empty) {
    return right
  }
  var result = splay(left.highest())
  result.right = right
  return result
}

Node.prototype.unshift = function unshift (item) {
  var node = new Node(item)
  var path = this.lowest()
  path.push('left')
  path.push(node)
  return splay(path)
}

Node.prototype.shift = function shift () {
  return splay(this.lowest()).right
}

Node.prototype.copy = function copy () {
  return new Node(this.value, this.left, this.right)
}

Node.prototype.higher = function higher () {
  var path = [this, 'right']
  var node = this.right
  if (node === empty) return empty
  return node.lowest(path)
}

Node.prototype.lower = function lower () {
  var path = [this, 'left']
  var node = this.left
  if (node === empty) return path
  return node.highest(path)
}

Node.prototype.highest = function highest (path) {
  var node = this
  path || (path = [])
  path.push(this.copy())
  while (node.right !== empty) {
    node = node.right
    path.push('right')
    path.push(node.copy())
  }
  return path
}

Node.prototype.lowest = function lowest (path) {
  var node = this
  path || (path = [])
  path.push(node.copy())
  while (node.left !== empty) {
    node = node.left
    path.push('left')
    path.push(node.copy())
  }
  return path
}

Node.prototype.pop = function pop () {
  return splay(this.highest()).left
}

Node.prototype.push = function push (item) {
  var node = new Node(item)
  var path = this.highest()
  path.push('right')
  path.push(node)
  return splay(path)
}

Node.prototype.first = function first () {
  if (this.left === empty) {
    return this
  }
  return splay(this.lowest())
}

Node.prototype.last = function last () {
  if (this.right === empty) {
    return this
  }
  return splay(this.highest())
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
