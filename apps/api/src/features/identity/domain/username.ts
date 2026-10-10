/** Launch implementation default, not a traditional Counterball rule. */
export const USERNAME_POLICY = Object.freeze({
  minimumLength: 3,
  maximumLength: 24,
});

export type Username = Readonly<{ display: string; key: string }>;

export class InvalidUsernameError extends Error {
  readonly code = "invalidUsername";
  constructor() {
    super("Use 3–24 letters, numbers, or underscores for your username.");
    this.name = "InvalidUsernameError";
  }
}

export function parseUsername(value: unknown): Username {
  if (
    typeof value !== "string" ||
    value.length < USERNAME_POLICY.minimumLength ||
    value.length > USERNAME_POLICY.maximumLength ||
    /[^A-Za-z0-9_]/.test(value)
  ) {
    throw new InvalidUsernameError();
  }
  return Object.freeze({ display: value, key: value.toLowerCase() });
}
