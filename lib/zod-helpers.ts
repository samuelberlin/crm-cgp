/**
 * `FormData.get()` returns `null` for a field that isn't present in the
 * form at all (e.g. an optional select not rendered in a given form), and
 * `""` for one that's present but left empty. Zod's `.optional()` only
 * accepts `undefined`, so both must be normalized before validation.
 */
export const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);
