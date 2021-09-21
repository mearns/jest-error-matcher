export {};

type ExpectedMessage = string;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toFailAssertion(...expected: Array<ExpectedMessage>): R;
    }
  }
}

interface JestAssertionErrorType extends Error {
  matcherResult: {
    pass: boolean;
    message: string;
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
const JestAssertionError = ((): Function => {
  try {
    expect(true).toBeFalsy();
  } catch (error) {
    return error.constructor;
  }
  throw new Error("Could not get handle on JestAssertionError");
})();

function isJestAssertionError(e: Error): e is JestAssertionErrorType {
  return e instanceof JestAssertionError;
}

expect.extend({
  async toFailAssertion(
    this: jest.MatcherUtils,
    received: (() => unknown) | Error,
    ...expectedMessages: Array<ExpectedMessage>
  ): Promise<{
    pass: boolean;
    message: () => string;
  }> {
    const options = {
      comment: "a function that throws a jest assertion error",
      isNot: this.isNot,
      promise: this.promise,
    };
    if (this.isNot && expectedMessages.length) {
      throw new Error(
        "toFailAssertion matcher cannot take expected messages when it is inverted with .not"
      );
    }
    const trigger =
      this.promise === "rejects"
        ? async () => {
            throw received;
          }
        : typeof received === "function"
        ? received
        : () => received;
    try {
      const result = await trigger();
      return {
        pass: false,
        message: () =>
          this.utils.matcherHint(
            "toFailAssertion",
            undefined,
            undefined,
            options
          ) +
          "\n\n" +
          "Expected function to throw an assertion error, but it completed successfully." +
          "\n\n" +
          this.utils.printWithType(
            "Returned value",
            result,
            this.utils.printReceived
          ),
      };
    } catch (error) {
      if (isJestAssertionError(error)) {
        if (this.isNot) {
          return {
            // Pass doesn't actually mean pass, it means it matches
            pass: true,
            message: () =>
              this.utils.matcherHint(
                "toFailAssertion",
                undefined,
                undefined,
                options
              ) +
              "\n\n" +
              "Expected function to not fail the assertion, but it did." +
              "\n\n" +
              "Assertion failure: " +
              this.utils.printReceived(error),
          };
        }
        return matchMatcherResult.bind(this)(
          options,
          error.matcherResult,
          expectedMessages
        );
      }
      if (this.isNot) {
        return {
          pass: true,
          message: () =>
            this.utils.matcherHint(
              "toFailAssertion",
              undefined,
              undefined,
              options
            ) +
            "\n\n" +
            "Function was not expected to fail an assertion, and it didn't, but it did throw another error" +
            "\n\n" +
            "Assertion failure: " +
            this.utils.printReceived(error),
        };
      }
      return {
        pass: false,
        message: () =>
          this.utils.matcherHint(
            "toFailAssertion",
            undefined,
            undefined,
            options
          ) +
          "\n\n" +
          "Expected function to throw a JestAssertionError, but it threw a different error" +
          "\n\n" +
          "Thrown error: " +
          this.utils.printReceived(error),
      };
    }
  },
});

function matchMatcherResult(
  this: jest.MatcherUtils,
  options,
  matcherResult: { pass: boolean; message: string },
  expectedMessages: Array<ExpectedMessage>
): { pass: boolean; message: () => string } {
  const receivedMessage = parseAnsi(matcherResult.message);
  let r = 0;
  const nextPlainChar = () => {
    while (r < receivedMessage.length && receivedMessage[r].t !== "text") {
      r++;
    }
    if (r >= receivedMessage.length) {
      return null;
    }
    const c = receivedMessage[r].v;
    r++;
    return c;
  };
  for (let e = 0; e < expectedMessages.length; e++) {
    const expected = expectedMessages[e];
    const startR = r;
    let matched = false;
    for (let s = startR; !matched; s++) {
      r = s;
      matched = true;
      for (let ei = 0; matched && ei < expected.length; ei++) {
        const rc = nextPlainChar();
        if (!rc) {
          return {
            pass: false,
            message: () =>
              this.utils.matcherHint(
                "toFailAssertion",
                undefined,
                undefined,
                options
              ) +
              "\n\n" +
              "Function failed an assertion as expected, but the matcher result message doesn't match" +
              "\n\n" +
              `Expected (#${e + 1}) ` +
              this.utils.printExpected(expected) +
              "\n\n" +
              `Received (starting at offset ${startR}): ` +
              this.utils.printReceived(
                receivedMessage
                  .slice(startR)
                  .filter((m) => m.t === "text")
                  .map((m) => m.v)
                  .join("")
              ),
          };
        }
        const ec = expected[ei];
        if (ec !== rc) {
          matched = false;
          break;
        }
      }
    }
  }
  return {
    pass: true,
    message: () => "You shouldn't ever see this",
  };
}

function parseAnsi(ansi: string): Array<{ t: "text" | "control"; v: string }> {
  const chars = [];
  for (let i = 0; i < ansi.length; ) {
    if (ansi.charAt(i) === "\u001b" && ansi.charAt(i + 1) === "[") {
      const s = i;
      i += 2;
      while (ansi.charAt(i) !== "m") {
        i++;
      }
      i++;
      chars.push({ t: "control", v: ansi.substring(s, i) });
    }
    const c = ansi.charAt(i);
    i++;
    if (c) {
      chars.push({ t: "text", v: c });
    } else {
      break;
    }
  }
  return chars;
}
