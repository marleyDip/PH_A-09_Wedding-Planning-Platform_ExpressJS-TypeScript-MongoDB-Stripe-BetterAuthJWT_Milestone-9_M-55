export { blankToUndefined } from "./blankToUndefined.js";
export { escapeRegex } from "./escapeRegex.js";

/* index.ts is used here as a "barrel" file to simplify imports across your project.

Why it's useful:

=> Cleaner imports: Instead of writing multiple import lines from individual files, you can import everything from the utils folder at once.

=> Without index.ts:

    import { blankToUndefined } from "./utils/blankToUndefined";
    import { escapeRegex } from "./utils/escapeRegex";

=> With index.ts (JavaScript/TypeScript automatically looks for index inside a folder):

    import { blankToUndefined, escapeRegex } from "./utils";

=> Easier refactoring: If you later rename escapeRegex.ts or move it to a subfolder, you only need to update the path inside index.ts rather than changing imports in every file across your app.

=> Controlled public API: It defines which functions inside utils/ are meant to be used by the rest of the project, keeping internal helper files private if you choose not to export them there.

(Note: The .js extension inside the TypeScript export is standard when using modern ESM module resolution in Node.js/TypeScript, as it matches the compiled output files).

Would you like to know about any potential downsides of barrel files (such as slower build times or circular dependency issues in large apps), or how to configure your tsconfig.json for this pattern?

*/
