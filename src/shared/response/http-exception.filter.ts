import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as _ from 'lodash';

@Injectable()
@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = (exception?.getResponse() as any).status
      ? (exception?.getResponse() as any).status
      : exception?.getStatus
      ? exception.getStatus()
      : 500;
    const errorType = exception.message;
    const messages = ((exception?.getResponse ? exception.getResponse() : null) as any)?.message ?? exception.message;
    const message = messages ? (_.isArray(messages) ? messages[0] : messages) : errorType;
    const error = { code: status, error: errorType, message };
    const data = {};

    response.status(status).send({
      status: false,
      error,
      data,
    });
  }
}
