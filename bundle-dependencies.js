#!/usr/bin/env node

var browserify = require('browserify')
var deps = require('./package.json').dependencies

var bundle = browserify()

Object.keys(deps).forEach(function (dep) {
  bundle.require(dep)
})

bundle.bundle().pipe(process.stdout)