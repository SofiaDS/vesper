// src/lib/authErrors.ts
//
// Traduzione degli errori Supabase Auth in errori applicativi.
// La UI non deve conoscere i messaggi originali di Supabase.

import { AuthError } from "../errors/AuthError"


const ERROR_MAP: {
  match: string
  create: (original?: unknown) => AuthError
}[] = [

  {
    match: "invalid login credentials",
    create: AuthError.invalidCredentials,
  },

  {
    match: "email not confirmed",
    create: AuthError.emailNotConfirmed,
  },

  {
    match: "user already registered",
    create: AuthError.userAlreadyRegistered,
  },

  {
    match: "password should be at least",
    create: AuthError.weakPassword,
  },

  {
    match: "unable to validate email address",
    create: AuthError.invalidEmail,
  },

  {
    match: "email rate limit exceeded",
    create: AuthError.rateLimit,
  },

  {
    match: "for security purposes",
    create: AuthError.rateLimit,
  },

  {
    match: "signups not allowed",
    create: AuthError.signupDisabled,
  },

]


export function mapSupabaseAuthError(
  error: unknown
): AuthError {


  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error
      ? String(error.message).toLowerCase()
      : ""


  const found =
    ERROR_MAP.find(
      e => message.includes(e.match)
    )


  if(found){
    return found.create(error)
  }


  return AuthError.unknown(error)
}



// Validazione client password
export function validatePassword(
  pw: string
): string | null {

  if(pw.length < 8){
    return "La password deve avere almeno 8 caratteri."
  }


  if(
    !/[A-Za-z]/.test(pw) ||
    !/[0-9]/.test(pw)
  ){
    return "La password deve contenere almeno una lettera e un numero."
  }


  return null
}