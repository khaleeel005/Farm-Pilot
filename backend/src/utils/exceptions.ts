export class CustomError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends CustomError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class InternalServerError extends CustomError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}
