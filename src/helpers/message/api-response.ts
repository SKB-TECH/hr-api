export class ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;

  private constructor(success: boolean, message: string, data: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static ok<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static created<T>(data: T, message = 'Created'): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }
}
