export class ResourceGoneError extends Error {
  public innerError: Error;
  constructor(innerError: Error, message?: string) {
    super(message);
    this.innerError = innerError;
  }
}
