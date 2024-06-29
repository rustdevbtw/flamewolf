// |reftest| shell-option(--enable-iterator-helpers) skip-if(!this.hasOwnProperty('Iterator')||!xulRuntime.shell) -- iterator-helpers is not enabled unconditionally, requires shell-options
// Copyright (C) 2020 Rick Waldron. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-iteratorprototype.drop
description: >
  Iterator.prototype.drop is callable
features: [iterator-helpers]
---*/
function* g() {}
Iterator.prototype.drop.call(g(), 0);

let iter = g();
iter.drop(0);

reportCompare(0, 0);
