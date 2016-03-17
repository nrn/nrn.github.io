var reduce = require('universal-reduce')
document.querySelector('main').onclick = function () {
  console.log('test')
}
reduce({ foo: 'bar' }, function (acc, val, key) {
  console.log(val, key)
})
console.log('hello world')
