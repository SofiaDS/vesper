export class AppError extends Error {
  public readonly code: string
  public readonly userMessage: string
  public readonly originalError?: unknown

  constructor(
    code: string,
    userMessage: string,
    originalError?: unknown
  ) {
    super(userMessage)

    this.name = "AppError"
    this.code = code
    this.userMessage = userMessage
    this.originalError = originalError
  }
}