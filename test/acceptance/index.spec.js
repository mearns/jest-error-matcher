/* eslint-env mocha */

/**
 * This is a quick sanity check to make sure that the compiled main-entry point
 * works. It requires that the code has been compiled.
 */

require("../..");

describe("This module as a JS package", () => {
  it.each(["toBeErrorMatching", "toThrowErrorMatching"])(
    "should extend jest with the %s matcher",
    (matcherName) => {
      expect(expect[matcherName]).toBeInstanceOf(Function);
    }
  );
});
