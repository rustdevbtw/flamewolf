// |reftest| shell-option(--enable-iterator-helpers) skip-if(!this.hasOwnProperty('Iterator')||!xulRuntime.shell) -- iterator-helpers is not enabled unconditionally, requires shell-options
// Copyright (C) 2020 Rick Waldron. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.map
description: >
  Iterator.prototype.map is not constructible.

  Built-in function objects that are not identified as constructors do not implement the [[Construct]] internal method unless otherwise specified in the description of a particular function.
features: [iterator-helpers]
---*/
function* g() {}
let iter = g();

assert.throws(TypeError, () => {
  new iter.map();
});

assert.throws(TypeError, () => {
  new iter.map(() => 0);
});

assert.throws(TypeError, () => {
  new Iterator.prototype.map(() => 0);
});

assert.throws(TypeError, () => {
  new class extends Iterator {}.map(() => 0);
});

reportCompare(0, 0);
