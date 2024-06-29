/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * Test the Text pattern's DocumentRange property. This also tests where the
 * Text pattern is exposed.
 */
addUiaTask(
  `
<div><input id="input" value="input"></div>
<textarea id="textarea">textarea</textarea>
<div id="contentEditable" contenteditable><p>content</p><p>editable</p></div>
<a id="link" href="#">link</a>
  `,
  async function testTextDocumentRange() {
    await definePyVar("doc", `getDocUia()`);
    await definePyVar("pattern", `getUiaPattern(doc, "Text")`);
    ok(await runPython(`bool(pattern)`), "doc has Text pattern");
    // The IA2 -> UIA proxy adds spaces between elements that don't exist.
    if (gIsUiaEnabled) {
      is(
        await runPython(`pattern.DocumentRange.GetText(-1)`),
        "inputtextareacontenteditablelink",
        "document DocumentRange Text correct"
      );
    }

    await assignPyVarToUiaWithId("input");
    await definePyVar("pattern", `getUiaPattern(input, "Text")`);
    ok(await runPython(`bool(pattern)`), "input has Text pattern");
    is(
      await runPython(`pattern.DocumentRange.GetText(-1)`),
      "input",
      "input DocumentRange Text correct"
    );

    await assignPyVarToUiaWithId("textarea");
    await definePyVar("pattern", `getUiaPattern(textarea, "Text")`);
    ok(await runPython(`bool(pattern)`), "textarea has Text pattern");
    is(
      await runPython(`pattern.DocumentRange.GetText(-1)`),
      "textarea",
      "textarea DocumentRange Text correct"
    );

    // The IA2 -> UIA proxy doesn't expose the Text pattern on contentEditables
    // without role="textbox".
    if (gIsUiaEnabled) {
      await assignPyVarToUiaWithId("contentEditable");
      await definePyVar("pattern", `getUiaPattern(contentEditable, "Text")`);
      ok(await runPython(`bool(pattern)`), "contentEditable has Text pattern");
      is(
        await runPython(`pattern.DocumentRange.GetText(-1)`),
        "contenteditable",
        "contentEditable DocumentRange Text correct"
      );
    }

    await testPatternAbsent("link", "Text");
  }
);

/**
 * Test the TextRange pattern's GetText method.
 */
addUiaTask(
  `<div id="editable" contenteditable role="textbox">a <span>b</span>`,
  async function testTextRangeGetText() {
    await runPython(`
      doc = getDocUia()
      editable = findUiaByDomId(doc, "editable")
      text = getUiaPattern(editable, "Text")
      global range
      range = text.DocumentRange
    `);
    is(await runPython(`range.GetText(-1)`), "a b", "GetText(-1) correct");
    is(await runPython(`range.GetText(0)`), "", "GetText(0) correct");
    is(await runPython(`range.GetText(1)`), "a", "GetText(1) correct");
    is(await runPython(`range.GetText(2)`), "a ", "GetText(2) correct");
    is(await runPython(`range.GetText(3)`), "a b", "GetText(3) correct");
    is(await runPython(`range.GetText(4)`), "a b", "GetText(4) correct");
  }
);

/**
 * Test the TextRange pattern's Clone method.
 */
addUiaTask(
  `<input id="input" type="text" value="testing">`,
  async function testTextRangeClone() {
    await runPython(`
      doc = getDocUia()
      input = findUiaByDomId(doc, "input")
      text = getUiaPattern(input, "Text")
      global origRange
      origRange = text.DocumentRange
    `);
    is(
      await runPython(`origRange.GetText(-1)`),
      "testing",
      "origRange text correct"
    );
    await runPython(`
      global clonedRange
      clonedRange = origRange.Clone()
    `);
    is(
      await runPython(`clonedRange.GetText(-1)`),
      "testing",
      "clonedRange text correct"
    );

    // Test that modifying clonedRange doesn't impact origRange.
    info("Collapsing clonedRange to start");
    await runPython(
      `clonedRange.MoveEndpointByRange(TextPatternRangeEndpoint_End, clonedRange, TextPatternRangeEndpoint_Start)`
    );
    is(
      await runPython(`clonedRange.GetText(-1)`),
      "",
      "clonedRange text correct"
    );
    is(
      await runPython(`origRange.GetText(-1)`),
      "testing",
      "origRange text correct"
    );
  }
);

/**
 * Test the TextRange pattern's Compare method.
 */
addUiaTask(
  `<input id="input" type="text" value="testing">`,
  async function testTextRangeCompare() {
    await runPython(`
      doc = getDocUia()
      input = findUiaByDomId(doc, "input")
      text = getUiaPattern(input, "Text")
      global range1, range2
      range1 = text.DocumentRange
      range2 = text.DocumentRange
    `);
    ok(
      await runPython(`range1.Compare(range2)`),
      "range1 Compare range2 correct"
    );
    ok(
      await runPython(`range2.Compare(range1)`),
      "range2 Compare range1 correct"
    );
    info("Collapsing range2 to start");
    await runPython(
      `range2.MoveEndpointByRange(TextPatternRangeEndpoint_End, range2, TextPatternRangeEndpoint_Start)`
    );
    ok(
      !(await runPython(`range1.Compare(range2)`)),
      "range1 Compare range2 correct"
    );
    ok(
      !(await runPython(`range2.Compare(range1)`)),
      "range2 Compare range1 correct"
    );
  }
);

/**
 * Test the TextRange pattern's CompareEndpoints method.
 */
addUiaTask(
  `
<p>before</p>
<div><input id="input" type="text" value="input"></div>
<p>after</p>
  `,
  async function testTextRangeCompareEndpoints() {
    await runPython(`
      global doc, range1, range2
      doc = getDocUia()
      input = findUiaByDomId(doc, "input")
      text = getUiaPattern(input, "Text")
      range1 = text.DocumentRange
      range2 = text.DocumentRange
    `);
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_Start, range1, TextPatternRangeEndpoint_Start)`
      ),
      0,
      "Compare range1 start to range1 start correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_End, range1, TextPatternRangeEndpoint_End)`
      ),
      0,
      "Compare range1 end to range1 end correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_Start, range1, TextPatternRangeEndpoint_End)`
      ),
      -1,
      "Compare range1 start to range1 end correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_End, range1, TextPatternRangeEndpoint_Start)`
      ),
      1,
      "Compare range1 end to range1 start correct"
    );
    // Compare different ranges.
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_Start, range2, TextPatternRangeEndpoint_Start)`
      ),
      0,
      "Compare range1 start to range2 start correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_End, range2, TextPatternRangeEndpoint_End)`
      ),
      0,
      "Compare range1 end to range2 end correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_Start, range2, TextPatternRangeEndpoint_End)`
      ),
      -1,
      "Compare range1 start to range2 end correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_End, range2, TextPatternRangeEndpoint_Start)`
      ),
      1,
      "Compare range1 end to range2 start correct"
    );
    // Compare ranges created using different elements.
    await definePyVar("range3", `getUiaPattern(doc, "Text").DocumentRange`);
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_Start, range3, TextPatternRangeEndpoint_Start)`
      ),
      1,
      "Compare range1 start to range3 start correct"
    );
    is(
      await runPython(
        `range1.CompareEndpoints(TextPatternRangeEndpoint_End, range3, TextPatternRangeEndpoint_End)`
      ),
      -1,
      "Compare range1 end to range3 end correct"
    );
  }
);

/**
 * Test the TextRange pattern's ExpandToEnclosingUnit method.
 */
addUiaTask(
  `
<p>before</p>
<div><textarea id="textarea" cols="5">ab cd ef gh</textarea></div>
<div>after <input id="input" value="input"></div>
  `,
  async function testTextRangeExpandToEnclosingUnit() {
    info("Getting DocumentRange from textarea");
    await runPython(`
      global doc, range
      doc = getDocUia()
      textarea = findUiaByDomId(doc, "textarea")
      text = getUiaPattern(textarea, "Text")
      range = text.DocumentRange
    `);
    is(
      await runPython(`range.GetText(-1)`),
      "ab cd ef gh",
      "range text correct"
    );
    // Expand should shrink the range because it's too big.
    info("Expanding to character");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Character)`);
    is(await runPython(`range.GetText(-1)`), "a", "range text correct");
    info("Collapsing to end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
    );
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    // range is now collapsed at "b".
    info("Expanding to character");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Character)`);
    is(await runPython(`range.GetText(-1)`), "b", "range text correct");
    info("Expanding to word");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Word)`);
    is(await runPython(`range.GetText(-1)`), "ab ", "range text correct");
    info("Collapsing to end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
    );
    // range is now collapsed at "c".
    info("Expanding to word");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Word)`);
    is(await runPython(`range.GetText(-1)`), "cd ", "range text correct");
    info("Expanding to line");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Line)`);
    is(await runPython(`range.GetText(-1)`), "ab cd ", "range text correct");
    info("Collapsing to end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
    );
    // range is now collapsed at "e".
    info("Expanding to line");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Line)`);
    // The IA2 -> UIA proxy gets most things below this wrong.
    if (!gIsUiaEnabled) {
      return;
    }
    is(await runPython(`range.GetText(-1)`), "ef gh", "range text correct");
    info("Expanding to document");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Document)`);
    is(
      await runPython(`range.GetText(-1)`),
      "beforeab cd ef ghafter input",
      "range text correct"
    );

    // Test expanding to a line which crosses elements.
    info("Getting DocumentRange from input");
    await runPython(`
      input = findUiaByDomId(doc, "input")
      text = getUiaPattern(input, "Text")
      global range
      range = text.DocumentRange
    `);
    info("Expanding to line");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Line)`);
    is(
      await runPython(`range.GetText(-1)`),
      "after input",
      "range text correct"
    );
    info("Collapsing to end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
    );
    // range is now collapsed at the end of the document.
    info("Expanding to line");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Line)`);
    is(
      await runPython(`range.GetText(-1)`),
      "after input",
      "range text correct"
    );
  }
);

/**
 * Test the TextRange pattern's Move method.
 */
addUiaTask(
  `
<p>ab</p>
<textarea id="textarea">cd ef gh</textarea>
<p>ij</p>
  `,
  async function testTextRangeMove() {
    await runPython(`
      doc = getDocUia()
      textarea = findUiaByDomId(doc, "textarea")
      text = getUiaPattern(textarea, "Text")
      global range
      range = text.DocumentRange
    `);
    is(await runPython(`range.GetText(-1)`), "cd ef gh", "range text correct");
    info("Moving 1 word");
    is(
      await runPython(`range.Move(TextUnit_Word, 1)`),
      1,
      "Move return correct"
    );
    is(await runPython(`range.GetText(-1)`), "ef ", "range text correct");
    info("Moving 3 words");
    // There are only 2 words after.
    is(
      await runPython(`range.Move(TextUnit_Word, 3)`),
      2,
      "Move return correct"
    );
    // The IA2 -> UIA proxy gets most things below this wrong.
    if (!gIsUiaEnabled) {
      return;
    }
    is(await runPython(`range.GetText(-1)`), "ij", "range text correct");
    info("Moving -5 words");
    // There are only 4 words before.
    is(
      await runPython(`range.Move(TextUnit_Word, -5)`),
      -4,
      "Move return correct"
    );
    is(await runPython(`range.GetText(-1)`), "ab", "range text correct");
    info("Moving 1 word");
    is(
      await runPython(`range.Move(TextUnit_Word, 1)`),
      1,
      "Move return correct"
    );
    is(await runPython(`range.GetText(-1)`), "cd ", "range text correct");
    info("Moving 1 character");
    is(
      await runPython(`range.Move(TextUnit_Character, 1)`),
      1,
      "Move return correct"
    );
    is(await runPython(`range.GetText(-1)`), "d", "range text correct");
    // When the range is not collapsed, Move moves backward to the start of the
    // unit before moving to the requested unit.
    info("Moving -1 word");
    is(
      await runPython(`range.Move(TextUnit_Word, -1)`),
      -1,
      "Move return correct"
    );
    is(await runPython(`range.GetText(-1)`), "ab", "range text correct");
    info("Collapsing to start");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_End, range, TextPatternRangeEndpoint_Start)`
    );
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    // range is now collapsed at "a".
    info("Moving 1 word");
    is(
      await runPython(`range.Move(TextUnit_Word, 1)`),
      1,
      "Move return correct"
    );
    // range is now collapsed at "c".
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    info("Expanding to character");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Character)`);
    is(await runPython(`range.GetText(-1)`), "c", "range text correct");
    info("Collapsing to end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
    );
    // range is now collapsed at "d".
    // When the range is collapsed, Move does *not* first move back to the start
    // of the unit.
    info("Moving -1 word");
    is(
      await runPython(`range.Move(TextUnit_Word, -1)`),
      -1,
      "Move return correct"
    );
    // range is collapsed at "c".
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Word)`);
    is(await runPython(`range.GetText(-1)`), "cd ", "range text correct");
  }
);

/**
 * Test the TextRange pattern's MoveEndpointByRange method.
 */
addUiaTask(
  `
<p>ab</p>
<div><textarea id="textarea">cd ef gh</textarea></div>
<p>ij</p>
  `,
  async function testTextRangeMoveEndpointByRange() {
    await runPython(`
      global doc, taRange, range
      doc = getDocUia()
      textarea = findUiaByDomId(doc, "textarea")
      text = getUiaPattern(textarea, "Text")
      taRange = text.DocumentRange
      range = text.DocumentRange
    `);
    is(await runPython(`range.GetText(-1)`), "cd ef gh", "range text correct");
    info("Expanding to character");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Character)`);
    is(await runPython(`range.GetText(-1)`), "c", "range text correct");
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
      ),
      -1,
      "start < end"
    );
    info("Moving end to start");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_End, range, TextPatternRangeEndpoint_Start)`
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_Start, range, TextPatternRangeEndpoint_End)`
      ),
      0,
      "start == end"
    );
    info("Moving range end to textarea end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_End, taRange, TextPatternRangeEndpoint_End)`
    );
    is(await runPython(`range.GetText(-1)`), "cd ef gh", "range text correct");
    info("Expanding to character");
    await runPython(`range.ExpandToEnclosingUnit(TextUnit_Character)`);
    is(await runPython(`range.GetText(-1)`), "c", "range text correct");
    info("Moving range start to textarea end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, taRange, TextPatternRangeEndpoint_End)`
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_Start, taRange, TextPatternRangeEndpoint_End)`
      ),
      0,
      "range start == textarea end"
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_End, taRange, TextPatternRangeEndpoint_End)`
      ),
      0,
      "range end == textarea end"
    );
    info("Moving range end to textarea start");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_End, taRange, TextPatternRangeEndpoint_Start)`
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_Start, taRange, TextPatternRangeEndpoint_Start)`
      ),
      0,
      "range start == textarea start"
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_End, taRange, TextPatternRangeEndpoint_Start)`
      ),
      0,
      "range end == textarea start"
    );
    await definePyVar("docRange", `getUiaPattern(doc, "Text").DocumentRange`);
    info("Moving range start to document start");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_Start, docRange, TextPatternRangeEndpoint_Start)`
    );
    info("Moving range end to document end");
    await runPython(
      `range.MoveEndpointByRange(TextPatternRangeEndpoint_End, docRange, TextPatternRangeEndpoint_End)`
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_Start, docRange, TextPatternRangeEndpoint_Start)`
      ),
      0,
      "range start == document start"
    );
    is(
      await runPython(
        `range.CompareEndpoints(TextPatternRangeEndpoint_End, docRange, TextPatternRangeEndpoint_End)`
      ),
      0,
      "range end == document end"
    );
  }
);

/**
 * Test the TextRange pattern's MoveEndpointByUnit method.
 */
addUiaTask(
  `
<p>ab</p>
<textarea id="textarea">cd ef gh</textarea>
<p>ij</p>
  `,
  async function testTextRangeMoveEndpointByUnit() {
    await runPython(`
      doc = getDocUia()
      textarea = findUiaByDomId(doc, "textarea")
      text = getUiaPattern(textarea, "Text")
      global range
      range = text.DocumentRange
    `);
    is(await runPython(`range.GetText(-1)`), "cd ef gh", "range text correct");
    info("Moving end -1 word");
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Word, -1)`
      ),
      -1,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "cd ef ", "range text correct");
    info("Moving end -4 words");
    // There are only 3 words before.
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Word, -4)`
      ),
      -3,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    info("Moving start 1 word");
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_Start, TextUnit_Word, 1)`
      ),
      1,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    info("Moving end 1 character");
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Character, 1)`
      ),
      1,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "c", "range text correct");
    info("Moving start 5 words");
    // There are only 4 word boundaries after.
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_Start, TextUnit_Word, 5)`
      ),
      4,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    info("Moving end -1 word");
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Word, -1)`
      ),
      -1,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "", "range text correct");
    info("Moving end 1 character");
    is(
      await runPython(
        `range.MoveEndpointByUnit(TextPatternRangeEndpoint_End, TextUnit_Character, 1)`
      ),
      1,
      "MoveEndpointByUnit return correct"
    );
    is(await runPython(`range.GetText(-1)`), "i", "range text correct");
  }
);
