import {
  ExceptionFilter,
  Catch,
  HttpException,
  HttpStatus,
  ArgumentsHost,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // Internal logging - full details for developers
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      console.error(`[${requestId}] HttpException:`, {
        status,
        path: request.url,
        method: request.method,
        userId: (request.user as { id?: string })?.id,
        exception,
        stack: exception instanceof Error ? exception.stack : undefined,
      });

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const res = exceptionResponse as { message?: string; error?: string };
        message = res.message || message;
        error = res.error || error;
      }
    } else if (exception instanceof Error) {
      // Log full error with stack trace
      console.error(`[${requestId}] Unexpected Error:`, {
        path: request.url,
        method: request.method,
        userId: (request.user as { id?: string })?.id,
        message: exception.message,
        stack: exception.stack,
        name: exception.name,
      });
      message = exception.message;
    } else {
      // Log unknown error type
      console.error(`[${requestId}] Unknown Exception:`, {
        path: request.url,
        method: request.method,
        userId: (request.user as { id?: string })?.id,
        exception,
      });
    }

    // Sanitized response to client - no internal details
    response.status(status).send({
      statusCode: status,
      message,
      error,
      timestamp,
      path: request.url,
    });
  }
}
