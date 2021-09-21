import type { ExpectedError } from "./custom-types";

interface CustomMatcherResult {
  pass: boolean;
  message: () => string;
}

export function toThrowErrorMatching(
  this: jest.MatcherUtils,
  received: unknown,
  expected: ExpectedError = {}
): CustomMatcherResult {
  if (this.isNot) {
    throw new Error(
      "This matcher does not support negation because it's too ambgious what that means"
    );
  }

  // With the .rejects modified, Jest will await the promise, catch an error, and then continue
  // on with the error as the received value. Or if the promise doesn't reject, then the assertion fails.
  if (this.promise === "rejects") {
    return toBeErrorMatching.call(this, received, expected);
  }

  if (typeof received !== "function") {
    return {
      pass: false,
      message: () =>
        "Received value must be a function" +
        "\n\n" +
        `Received: ${this.utils.printReceived(received)}`,
    };
  }

  try {
    const result = received();
    return {
      pass: false,
      message: () =>
        "Expected function to throw an error, but it returned successfully" +
        "\n\n" +
        `Returned value: ${this.utils.printReceived(result)}`,
    };
  } catch (thrownError) {
    return toBeErrorMatching.call(this, thrownError, expected);
  }
}

export function toBeErrorMatching(
  this: jest.MatcherUtils,
  received: unknown,
  expected: ExpectedError = {}
): CustomMatcherResult {
  if (this.isNot) {
    throw new Error(
      "This matcher does not support negation because it's too ambgious what that means"
    );
  }

  const isInstance = received instanceof Error;
  const comparableReceived = errorToComparable(received);
  const comparableExpected = errorToComparable(expected);
  let matches: boolean;
  try {
    expect(comparableReceived).toMatchObject(comparableExpected);
    matches = true;
  } catch {
    matches = false;
  }

  const passes = isInstance && matches;
  const options = {
    comment: "an Error with matching properties",
    isNot: this.isNot,
    promise: this.promise,
  };
  return {
    pass: passes,
    // This is the message if it didn't match
    message: () => {
      const [diffable, additional] = getDiffableAndAdditional(
        comparableReceived,
        comparableExpected
      );
      const hint = this.utils.matcherHint(
        "toBeError",
        undefined,
        undefined,
        options
      );
      const typeReport = isInstance
        ? "Received value was an Error, as expected, " +
          this.utils.RECEIVED_COLOR(
            "but it did not match the given properties (see below for diff)."
          )
        : this.utils.RECEIVED_COLOR(
            `Expected an Error, received ${getErrorType(received)}.`
          ) +
          " " +
          (matches
            ? "However it matches all of the expected properties."
            : this.utils.RECEIVED_COLOR(
                "Additionally, the received value does not match the expected properties (see below for diff)."
              ));
      const diff: true | string =
        matches ||
        this.utils.printDiffOrStringify(
          comparableExpected,
          diffable,
          "Expected",
          "Received",
          this.expand
        );
      const additionalPropertiesReport: false | string =
        Boolean(!matches && additional && Object.keys(additional).length) &&
        `Also received the following properties, which were ignored for matching:\n\n${this.utils.DIM_COLOR(
          "{"
        )}\n${Object.entries(additional)
          .map(([k, v]) =>
            this.utils.DIM_COLOR(`  ${k}: ${this.utils.stringify(v)}`)
          )
          .join(",\n")}\n${this.utils.DIM_COLOR("}")}`;
      const reports = [hint, typeReport];
      if (diff !== true) {
        reports.push(diff);
      }
      if (additionalPropertiesReport) {
        reports.push(additionalPropertiesReport);
      }
      return reports.join("\n\n");
    },
  };
}

function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    return "an Error";
  } else if (Array.isArray(error)) {
    if (error.length === 0) {
      return "an empty array";
    }
    return "an Array";
  } else if (typeof error === "undefined") {
    return "undefined";
  } else if (error === null) {
    return "null";
  } else if (typeof error === "string") {
    if (error.length === 0) {
      return "an empty string";
    } else if (error.length < 20) {
      return JSON.stringify(error);
    }
    return "a string";
  } else if (typeof error === "object") {
    return "an object";
  } else if (typeof error === "symbol") {
    return `a symbol (${String(error)})`;
  } else if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  const type = typeof error;
  if (/^[aeiouh]/.test(type)) {
    return `an ${type}`;
  }
  return `a ${type}`;
}

function errorToComparable(
  error: ExpectedError
): Record<string | number | symbol, unknown>;

// eslint-disable-next-line no-redeclare
function errorToComparable(error: unknown): unknown;

// eslint-disable-next-line no-redeclare
function errorToComparable(
  error: ExpectedError | unknown
): Record<string | number | symbol, unknown> | unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error,
    };
  }
  return error;
}

function getDiffableAndAdditional(
  received: unknown,
  expected: Record<string | number | symbol, unknown>
): [unknown, null | Record<string | number | symbol, unknown>] {
  if (received && typeof received === "object") {
    const relevantKeys = new Set([
      ...Object.keys(received),
      ...Object.keys(expected),
    ]);
    return [...relevantKeys].reduce(
      ([diffable, additional], key) => {
        if (key in expected) {
          if (key in received) {
            diffable[key] = received[key];
          }
        } else {
          additional[key] = received[key];
        }
        return [diffable, additional];
      },
      [{}, {}]
    );
  }
  return [received, null];
}
