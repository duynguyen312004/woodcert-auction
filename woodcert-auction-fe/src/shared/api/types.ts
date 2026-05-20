export type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
};

export type PaginationResponse<T> = {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: T[];
};

export type ApiError = {
  statusCode?: number;
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
  details?: unknown;
  isAuthError: boolean;
};
