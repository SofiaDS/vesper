import { AppError } from "./AppError"


export function handleError(
  error: unknown
): AppError {


  if(error instanceof AppError){
    return error
  }


  console.error(
    "Unhandled error:",
    error
  )


  return new AppError(
    "UNKNOWN_ERROR",
    "Si è verificato un errore imprevisto",
    error
  )
}