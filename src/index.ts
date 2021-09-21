import { toBeErrorMatching, toThrowErrorMatching } from "./matcher";
import type { ExpectedError } from "./custom-types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Expect {
      toBeErrorMatching(matching?: ExpectedError): unknown;
      toThrowErrorMatching(matching?: ExpectedError): unknown;
    }
    interface Matchers<R> {
      toBeErrorMatching(matching?: ExpectedError): R;
      toThrowErrorMatching(matching?: ExpectedError): R;
    }
  }
}

expect.extend({ toBeErrorMatching, toThrowErrorMatching });
