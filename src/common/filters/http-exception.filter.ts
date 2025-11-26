// src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';

    // Handle different response types
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;

      // Handle validation errors (returns array of messages)
      if (Array.isArray(responseObj.message)) {
        message = responseObj.message.join(', ');
      } else if (responseObj.message) {
        message = responseObj.message;
      } else if (responseObj.error) {
        message = responseObj.error;
      }
    }

    // Log the error
    console.error('HTTP Exception:', {
      status,
      message,
      timestamp: new Date().toISOString(),
    });

    // Send consistent error response
    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}
