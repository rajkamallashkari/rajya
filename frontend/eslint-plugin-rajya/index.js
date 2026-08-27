import { noHardcodedHex } from "./rules/no-hardcoded-hex.js";
import { noRawButton } from "./rules/no-raw-button.js";
import { noUserFacingString } from "./rules/no-user-facing-string.js";
import { noWholeStoreZustand } from "./rules/no-whole-store-zustand.js";
import { noZIndexLiteral } from "./rules/no-z-index-literal.js";

const plugin = {
  meta: { name: "eslint-plugin-rajya" },
  rules: {
    "no-raw-button": noRawButton,
    "no-hardcoded-hex": noHardcodedHex,
    "no-z-index-literal": noZIndexLiteral,
    "no-user-facing-string": noUserFacingString,
    "no-whole-store-zustand": noWholeStoreZustand,
  },
};

export default plugin;
