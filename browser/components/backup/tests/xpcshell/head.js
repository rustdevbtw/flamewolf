/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

"use strict";

const { BackupService } = ChromeUtils.importESModule(
  "resource:///modules/backup/BackupService.sys.mjs"
);

const { BackupResource } = ChromeUtils.importESModule(
  "resource:///modules/backup/BackupResource.sys.mjs"
);

const { TelemetryTestUtils } = ChromeUtils.importESModule(
  "resource://testing-common/TelemetryTestUtils.sys.mjs"
);

const { Sqlite } = ChromeUtils.importESModule(
  "resource://gre/modules/Sqlite.sys.mjs"
);

const { sinon } = ChromeUtils.importESModule(
  "resource://testing-common/Sinon.sys.mjs"
);

const BYTES_IN_KB = 1000;

const FAKE_METADATA = {
  date: "2024-06-07T00:00:00+00:00",
  appName: "firefox",
  appVersion: "128.0",
  buildID: "20240604133346",
  profileName: "profile-default",
  machineName: "A super cool machine",
  osName: "Windows_NT",
  osVersion: "10.0",
  legacyClientID: "decafbad-0cd1-0cd2-0cd3-decafbad1000",
  accountID: "",
  accountEmail: "",
};

do_get_profile();

/**
 * Some fake backup resource classes to test with.
 */
class FakeBackupResource1 extends BackupResource {
  static get key() {
    return "fake1";
  }
  static get requiresEncryption() {
    return false;
  }
}

/**
 * Another fake backup resource class to test with.
 */
class FakeBackupResource2 extends BackupResource {
  static get key() {
    return "fake2";
  }
  static get requiresEncryption() {
    return false;
  }
  static get priority() {
    return 1;
  }
}

/**
 * Yet another fake backup resource class to test with.
 */
class FakeBackupResource3 extends BackupResource {
  static get key() {
    return "fake3";
  }
  static get requiresEncryption() {
    return false;
  }
  static get priority() {
    return 2;
  }
}

/**
 * Create a file of a given size in kilobytes.
 *
 * @param {string} path the path where the file will be created.
 * @param {number} sizeInKB size file in Kilobytes.
 * @returns {Promise<undefined>}
 */
async function createKilobyteSizedFile(path, sizeInKB) {
  let bytes = new Uint8Array(sizeInKB * BYTES_IN_KB);
  await IOUtils.write(path, bytes);
}

/**
 * @typedef {object} TestFileObject
 * @property {(string|Array.<string>)} path
 *   The relative path of the file. It can be a string or an array of strings
 *   in the event that directories need to be created. For example, this is
 *   an array of valid TestFileObjects.
 *
 *   [
 *     { path: "file1.txt" },
 *     { path: ["dir1", "file2.txt"] },
 *     { path: ["dir2", "dir3", "file3.txt"], sizeInKB: 25 },
 *     { path: "file4.txt" },
 *   ]
 *
 * @property {number} [sizeInKB=10]
 *   The size of the created file in kilobytes. Defaults to 10.
 */

/**
 * Easily creates a series of test files and directories under parentPath.
 *
 * @param {string} parentPath
 *   The path to the parent directory where the files will be created.
 * @param {TestFileObject[]} testFilesArray
 *   An array of TestFileObjects describing what test files to create within
 *   the parentPath.
 * @see TestFileObject
 * @returns {Promise<undefined>}
 */
async function createTestFiles(parentPath, testFilesArray) {
  for (let { path, sizeInKB } of testFilesArray) {
    if (Array.isArray(path)) {
      // Make a copy of the array of path elements, chopping off the last one.
      // We'll assume the unchopped items are directories, and make sure they
      // exist first.
      let folders = path.slice(0, -1);
      await IOUtils.getDirectory(PathUtils.join(parentPath, ...folders));
    }

    if (sizeInKB === undefined) {
      sizeInKB = 10;
    }

    // This little piece of cleverness coerces a string into an array of one
    // if path is a string, or just leaves it alone if it's already an array.
    let filePath = PathUtils.join(parentPath, ...[].concat(path));
    await createKilobyteSizedFile(filePath, sizeInKB);
  }
}

/**
 * Checks that files exist within a particular folder. The filesize is not
 * checked.
 *
 * @param {string} parentPath
 *   The path to the parent directory where the files should exist.
 * @param {TestFileObject[]} testFilesArray
 *   An array of TestFileObjects describing what test files to search for within
 *   parentPath.
 * @see TestFileObject
 * @returns {Promise<undefined>}
 */
async function assertFilesExist(parentPath, testFilesArray) {
  for (let { path } of testFilesArray) {
    let copiedFileName = PathUtils.join(parentPath, ...[].concat(path));
    Assert.ok(
      await IOUtils.exists(copiedFileName),
      `${copiedFileName} should exist in the staging folder`
    );
  }
}

/**
 * Remove a file or directory at a path if it exists and files are unlocked.
 *
 * @param {string} path path to remove.
 */
async function maybeRemovePath(path) {
  try {
    await IOUtils.remove(path, { ignoreAbsent: true, recursive: true });
  } catch (error) {
    // Sometimes remove() throws when the file is not unlocked soon
    // enough.
    if (error.name != "NS_ERROR_FILE_IS_LOCKED") {
      // Ignoring any errors, as the temp folder will be cleaned up.
      console.error(error);
    }
  }
}

/**
 * A generator function for deterministically generating a sequence of
 * pseudo-random numbers between 0 and 255 with a fixed seed. This means we can
 * generate an arbitrary amount of nonsense information, but that generation
 * will be consistent between test runs. It's definitely not a cryptographically
 * secure random number generator! Please don't use it for that!
 *
 * @yields {number}
 *   The next number in the sequence.
 */
function* seededRandomNumberGenerator() {
  // This is a verbatim copy of the public domain-licensed code in
  // https://github.com/bryc/code/blob/master/jshash/PRNGs.md for the sfc32
  // PRNG (see https://pracrand.sourceforge.net/RNG_engines.txt)
  let sfc32 = function (a, b, c, d) {
    return function () {
      a |= 0;
      b |= 0;
      c |= 0;
      d |= 0;
      var t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  };

  // The seeds don't need to make sense, they just need to be the same from
  // test run to test run to give us a consistent stream of nonsense.
  const SEED1 = 123;
  const SEED2 = 456;
  const SEED3 = 789;
  const SEED4 = 101;

  let generator = sfc32(SEED1, SEED2, SEED3, SEED4);

  while (true) {
    yield Math.round(generator() * 1000) % 255;
  }
}

/**
 * Compares 2 Uint8Arrays and checks their similarity. This is mainly used to
 * test that the encrypted bytes passed through ArchiveEncryptor actually get
 * changed, and that the bytes that come out of ArchiveDecryptor match the
 * source bytes. This doesn't test that the resulting bytes have gone through
 * the Web Crypto API.
 *
 * When expecting similar arrays, we expect the byte lengths to be the same, and
 * for the bytes to match. When expecting dissimilar arrays, we expect the byte
 * lengths to be different and for at least one byte to be dissimilar between
 * the two arrays.
 *
 * @param {Uint8Array} uint8ArrayA
 *   The left-side of the Uint8Array comparison.
 * @param {Uint8Array} uint8ArrayB
 *   The right-side fo the Uint8Array comparison.
 * @param {boolean} expectSimilar
 *   True if the caller expects the two arrays to be similar, false otherwise.
 */
function assertUint8ArraysSimilarity(uint8ArrayA, uint8ArrayB, expectSimilar) {
  let lengthToCheck;
  if (expectSimilar) {
    Assert.equal(
      uint8ArrayA.byteLength,
      uint8ArrayB.byteLength,
      "Uint8Arrays have the same byteLength"
    );
    lengthToCheck = uint8ArrayA.byteLength;
  } else {
    Assert.notEqual(
      uint8ArrayA.byteLength,
      uint8ArrayB.byteLength,
      "Uint8Arrays have differing byteLength"
    );
    lengthToCheck = Math.min(uint8ArrayA.byteLength, uint8ArrayB.byteLength);
  }

  let foundDifference = false;
  for (let i = 0; i < lengthToCheck; ++i) {
    if (uint8ArrayA[i] != uint8ArrayB[i]) {
      foundDifference = true;
      break;
    }
  }

  if (expectSimilar) {
    Assert.ok(!foundDifference, "Arrays contain the same bytes.");
  } else {
    Assert.ok(foundDifference, "Arrays contain different bytes.");
  }
}
