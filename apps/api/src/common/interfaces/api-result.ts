export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | { error: ApiError };
