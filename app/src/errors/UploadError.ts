import { AppError } from "./AppError"


export class UploadError extends AppError {


  constructor(
    code:string,
    userMessage:string,
    originalError?:unknown
  ){
    super(
      code,
      userMessage,
      originalError
    )

    this.name="UploadError"
  }


  static fileTooLarge(){
    return new UploadError(
      "UPLOAD_TOO_LARGE",
      "Il file è troppo grande"
    )
  }


  static failed(
    originalError?:unknown
  ){
    return new UploadError(
      "UPLOAD_FAILED",
      "Caricamento fallito",
      originalError
    )
  }
}