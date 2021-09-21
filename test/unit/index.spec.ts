/* eslint-env mocha */
/* eslint no-unused-expressions: off */

// Module under test
import "../../src";

// Utilities
import "../test-utils/to-fail-assertion";

it.only("shou'd", () => {
  expect(() => {
    throw Object.assign(new Error("Wrong error message"), {
      foo: "wrong foo value",
    });
  }).toThrowErrorMatching({
    foo: "Correct foo value",
    message: "Correct error message",
  });
});

describe("the toBeErrorMatching", () => {
  it("should throw an error when the expectation is negated", () => {
    expect(() => {
      expect(new Error("foo")).not.toBeErrorMatching({});
    }).toThrowError(
      "This matcher does not support negation because it's too ambgious what that means"
    );
  });

  (
    [
      [true, "Test message"],
      [false, "this isn't right"],
    ] as Array<[boolean, string]>
  ).forEach(([passes, errorMessage]) => {
    it.each([
      ["a string", "Test message", '"Test message"'],
      [
        "an asymmetric matcher",
        expect.stringMatching(/^Test[ ]mes{2}age$/),
        "StringMatching /^Test[ ]mes{2}age$/",
      ],
    ])(
      `should ${passes ? "pass" : "not pass"} when the error message ${
        passes ? "matches" : "doesn't match"
      } %s given for the message property`,
      async (_, expected: unknown, repr: string) => {
        const exercise = () => {
          expect(new Error(errorMessage)).toBeErrorMatching({
            message: expected,
          });
        };
        if (passes) {
          exercise();
        } else {
          await expect(exercise).toFailAssertion(
            "Received value was an Error, as expected, but it did not match the given properties (see below for diff).",
            "- Expected  - 1",
            "+ Received  + 1",
            `-   "message": ${repr}`,
            `+   "message": ${JSON.stringify(errorMessage)}`
          );
        }
      }
    );
  });

  (
    [
      [true, "CustomError456"],
      [false, "CustomError123"],
    ] as Array<[boolean, string]>
  ).forEach(([passes, errorName]) => {
    it.each([
      ["a string", "CustomError456", '"CustomError456"'],
      [
        "an asymmetric matcher",
        expect.stringMatching(/^CustomError[4][5][6]/),
        "StringMatching /^CustomError[4][5][6]/",
      ],
    ])(
      `should ${passes ? "pass" : "not pass"} when the error name ${
        passes ? "matches" : "doesn't match"
      } %s given for the name property`,
      async (_, expected: unknown, repr: string) => {
        const exercise = () => {
          expect(
            new CustomError(errorName, "test error message")
          ).toBeErrorMatching({
            name: expected,
          });
        };
        if (passes) {
          exercise();
        } else {
          await expect(exercise).toFailAssertion(
            "Received value was an Error, as expected, but it did not match the given properties (see below for diff).",
            "- Expected  - 1",
            "+ Received  + 1",
            `-   "name": ${repr}`,
            `+   "name": ${JSON.stringify(errorName)}`
          );
        }
      }
    );
  });

  (
    [
      [true, "foo value"],
      [false, "wrong value"],
    ] as Array<[boolean, string]>
  ).forEach(([passes, propertyValue]) => {
    it.each([
      ["a string", "foo value", '"foo value"'],
      [
        "an asymmetric matcher",
        expect.stringMatching(/^foo[ ]valu[e]/),
        "StringMatching /^foo[ ]valu[e]/",
      ],
    ])(
      `should ${passes ? "pass" : "not pass"} when the error name ${
        passes ? "matches" : "doesn't match"
      } %s given for a custom property`,
      async (_, expected: unknown, repr: string) => {
        const exercise = () => {
          expect(
            new CustomError("test error message", { foo: propertyValue })
          ).toBeErrorMatching({
            foo: expected,
          });
        };
        if (passes) {
          exercise();
        } else {
          await expect(exercise).toFailAssertion(
            "Received value was an Error, as expected, but it did not match the given properties (see below for diff).",
            "- Expected  - 1",
            "+ Received  + 1",
            `-   "foo": ${repr}`,
            `+   "foo": ${JSON.stringify(propertyValue)}`
          );
        }
      }
    );
  });

  it("should match any Error if no arguments are given", async () => {
    expect(new CustomError("Test error message")).toBeErrorMatching();
  });

  it("should not match a non-Error even if no arguments are given", async () => {
    await expect(() => {
      expect({ name: "Error" }).toBeErrorMatching();
    }).toFailAssertion(
      "Expected an Error, received an object. However it matches all of the expected properties."
    );
  });

  it.each([
    ["an object", { name: "Error" }, "an object"],
    ["null", null, "null"],
    ["undeefined", undefined, "undefined"],
    ["an empty array", [], "an empty array"],
    ["a non-empty array", [null], "an Array"],
    ["an empty string", "", "an empty string"],
    ["an short string", "foobar", '"foobar"'],
    ["a long string", "abcdefghijklmnopqrstuvwxyz", "a string"],
    ["a symbol", Symbol("foo"), "a symbol (Symbol(foo))"],
    ["a number", 15.4, "15.4"],
    ["zero", 0, "0"],
    ["true", true, "true"],
    ["false", false, "false"],
    ["a function", () => "anything", "a function"],
  ])(
    "should fail if the subject is %s",
    async (_, subject, describeReceived) => {
      await expect(() => {
        expect(subject).toBeErrorMatching();
      }).toFailAssertion(`Expected an Error, received ${describeReceived}.`);
    }
  );

  it("should ensure that the value is an Error (matching expected properties)", async () => {
    await expect(() => {
      expect({ name: "CustomError" }).toBeErrorMatching({
        name: "CustomError",
      });
    }).toFailAssertion(
      "Expected an Error, received an object. However it matches all of the expected properties."
    );
  });

  it("should ensure that the value is an Error (non-matching expected properties)", async () => {
    await expect(() =>
      expect({ name: "CustomError" }).toBeErrorMatching({
        name: "ByAnyOtherName",
      })
    ).toFailAssertion(
      "Expected an Error, received an object. Additionally, the received value does not match the expected properties (see below for diff).",
      '-   "name": "ByAnyOtherName"',
      '+   "name": "CustomError"'
    );
  });
});

describe("the toThrowErrorMatching matcher", () => {
  it("should throw an error when the expectation is negated", () => {
    expect(() => {
      expect(() => {
        throw new Error("foo");
      }).not.toThrowErrorMatching({});
    }).toThrowError(
      "This matcher does not support negation because it's too ambgious what that means"
    );
  });

  it("should pass for matching thrown errors", () => {
    expect(() => {
      throw new CustomError("CustomErrorName789", "This is my test error", {
        foo: "foo value",
      });
    }).toThrowErrorMatching({
      name: "CustomErrorName789",
      message: "This is my test error",
      foo: "foo value",
    });
  });

  it("should fail for non-matching thrown errors", async () => {
    await expect(() => {
      expect(() => {
        throw new CustomError(
          "CustomErrorName123",
          "This is the wrong test error",
          {
            foo: "foo value",
          }
        );
      }).toThrowErrorMatching({
        name: "CustomErrorName789",
        message: "This is my test error",
        foo: "foo value",
      });
    }).toFailAssertion(
      "Received value was an Error, as expected, but it did not match the given properties (see below for diff).",
      '-   "message": "This is my test error"',
      '-   "name": "CustomErrorName789"',
      '+   "message": "This is the wrong test error"',
      '+   "name": "CustomErrorName123"'
    );
  });

  it("should fail if the given subject is not a function", async () => {
    await expect(() => {
      expect("some other received value").toThrowErrorMatching({
        name: "CustomErrorName789",
        message: "This is my test error",
        foo: "foo value",
      });
    }).toFailAssertion(
      "Received value must be a function",
      'Received: "some other received value"'
    );
  });

  it("should fail if the given subject does not throw", async () => {
    await expect(() => {
      expect(() => "returned value").toThrowErrorMatching({
        name: "CustomErrorName789",
        message: "This is my test error",
        foo: "foo value",
      });
    }).toFailAssertion(
      "Expected function to throw an error, but it returned successfully",
      'Returned value: "returned value"'
    );
  });

  it("should throw an error if the expectation is negated", () => {
    expect(() => {
      expect(() => "whatever").not.toThrowErrorMatching({});
    }).toThrowError(
      "This matcher does not support negation because it's too ambgious what that means"
    );
  });

  it("should match any Error if no arguments are given", async () => {
    expect(() => {
      throw new CustomError("Test error message");
    }).toThrowErrorMatching();
  });

  it("should not match a non-Error even if no arguments are given", async () => {
    await expect(() => {
      expect(() => {
        throw { name: "Error" }; // eslint-disable-line no-throw-literal
      }).toThrowErrorMatching();
    }).toFailAssertion(
      "Expected an Error, received an object. However it matches all of the expected properties."
    );
  });
});

describe.each(["toThrowErrorMatching", "toBeErrorMatching"])(
  "the %s matcher with the .rejects modifier",
  (matcherName) => {
    it("should pass when the reason for rejection matches the expected error", async () => {
      await expect(
        Promise.reject(
          new CustomError("CustomErrorName789", "This is my test error", {
            foo: "foo value",
          })
        )
      ).rejects[matcherName]({
        name: "CustomErrorName789",
        message: "This is my test error",
        foo: "foo value",
      });
    });

    it("should pass when the received value is a function that returns a promise whose reason for rejection matches the expected error", async () => {
      await expect(() =>
        Promise.reject(
          new CustomError("CustomErrorName789", "This is my test error", {
            foo: "foo value",
          })
        )
      ).rejects[matcherName]({
        name: "CustomErrorName789",
        message: "This is my test error",
        foo: "foo value",
      });
    });

    it("should fail when the reason for rejection of a promise doesn't match the expected error", async () => {
      await expect(async () => {
        await expect(
          Promise.reject(
            new CustomError(
              "CustomErrorName123",
              "This is the wrong test error",
              {
                foo: "wrong foo value",
              }
            )
          )
        ).rejects[matcherName]({
          name: "CustomErrorName789",
          message: "This is my test error",
          foo: "foo value",
        });
      }).toFailAssertion(
        "Received value was an Error, as expected, but it did not match the given properties (see below for diff).",
        '-   "foo": "foo value"',
        '-   "message": "This is my test error"',
        '-   "name": "CustomErrorName789"',
        '+   "foo": "wrong foo value"',
        '+   "message": "This is the wrong test error"',
        '+   "name": "CustomErrorName123"'
      );
    });

    it("should fail when the reason for rejection of a function doesn't match the expected error", async () => {
      await expect(async () => {
        await expect(() =>
          Promise.reject(
            new CustomError(
              "CustomErrorName123",
              "This is the wrong test error",
              {
                foo: "wrong foo value",
              }
            )
          )
        ).rejects[matcherName]({
          name: "CustomErrorName789",
          message: "This is my test error",
          foo: "foo value",
        });
      }).toFailAssertion(
        "Received value was an Error, as expected, but it did not match the given properties (see below for diff).",
        '-   "foo": "foo value"',
        '-   "message": "This is my test error"',
        '-   "name": "CustomErrorName789"',
        '+   "foo": "wrong foo value"',
        '+   "message": "This is the wrong test error"',
        '+   "name": "CustomErrorName123"'
      );
    });
  }
);

type RealObject = Record<string | number | symbol, unknown>;

type CustomErrorArgsWithName = [string, string, RealObject?];
type CustomErrorArgsWithOutName = [string, RealObject?];

class CustomError extends Error {
  constructor(...args: CustomErrorArgsWithName | CustomErrorArgsWithOutName) {
    let name: string;
    let message: string;
    let props: RealObject = {};
    if (hasName(args)) {
      [name, message, props] = args;
    } else {
      name = "CustomError";
      [message, props] = args;
    }
    super(message);
    this.name = name;
    Error.captureStackTrace(this, CustomError);
    Object.assign(this, props ?? {});
  }
}

function hasName(
  args: CustomErrorArgsWithName | CustomErrorArgsWithOutName
): args is CustomErrorArgsWithName {
  return (
    args.length >= 2 &&
    typeof args[0] === "string" &&
    typeof args[1] === "string"
  );
}
