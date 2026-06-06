import { AppError } from "./AppError"

export class AuthError extends AppError {

  constructor(
    code: string,
    userMessage: string,
    originalError?: unknown
  ) {
    super(
      code,
      userMessage,
      originalError
    )

    this.name = "AuthError"
  }


  static invalidCredentials(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_INVALID_CREDENTIALS",
      "Email o password non corretti.",
      originalError
    )
  }


  static emailNotConfirmed(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_EMAIL_NOT_CONFIRMED",
      "Devi prima confermare la tua email: controlla la posta (anche lo spam).",
      originalError
    )
  }


  static userAlreadyRegistered(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_USER_EXISTS",
      "Esiste già un account con questa email. Prova ad accedere.",
      originalError
    )
  }


  static weakPassword(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_WEAK_PASSWORD",
      "La password è troppo corta.",
      originalError
    )
  }


  static invalidEmail(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_INVALID_EMAIL",
      "Indirizzo email non valido.",
      originalError
    )
  }


  static rateLimit(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_RATE_LIMIT",
      "Troppi tentativi. Riprova tra qualche minuto.",
      originalError
    )
  }


  static signupDisabled(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_SIGNUP_DISABLED",
      "Le registrazioni sono al momento disabilitate.",
      originalError
    )
  }


  static sessionExpired(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_SESSION_EXPIRED",
      "La sessione è scaduta.",
      originalError
    )
  }


  static unknown(
    originalError?: unknown
  ) {
    return new AuthError(
      "AUTH_UNKNOWN",
      "Errore durante l'autenticazione.",
      originalError
    )
  }
}