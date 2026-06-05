import { AppError } from "./AppError"


export class DatabaseError extends AppError {

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

    this.name = "DatabaseError"
  }


  static queryFailed(
    originalError?: unknown
  ) {
    return new DatabaseError(
      "DATABASE_QUERY_FAILED",
      "Errore nel recupero dei dati",
      originalError
    )
  }


  static saveFailed(
    originalError?: unknown
  ) {
    return new DatabaseError(
      "DATABASE_SAVE_FAILED",
      "Errore nel salvataggio dei dati",
      originalError
    )
  }


  static deleteFailed(
    originalError?: unknown
  ) {
    return new DatabaseError(
      "DATABASE_DELETE_FAILED",
      "Errore durante la cancellazione",
      originalError
    )
  }
}