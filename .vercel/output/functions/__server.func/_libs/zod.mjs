import { B as _coercedString, E as ZodString, T as ZodBoolean, z as _coercedBoolean } from "./@better-auth/core+[...].mjs";
// node_modules/zod/v4/classic/coerce.js
function string(params) {
	return _coercedString(ZodString, params);
}
function boolean(params) {
	return _coercedBoolean(ZodBoolean, params);
}
export { string as n, boolean as t };
