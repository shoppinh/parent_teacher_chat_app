import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Response {
  status: boolean;
  error: any;
  data: any;
}

@Injectable()
export class AppInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //console.log(`Before...`);

    return next.handle().pipe(
      tap((data) => {
        //Call log or something else
        //console.log(`After...`, data);
      }),
      timeout(Number(process.env.APP_TIME_OUT)),
      catchError((err: any) => {
        //console.log(`catchError...`, err.status);
        if (err instanceof TimeoutError) {
          return throwError(new RequestTimeoutException());
        }
        return throwError(err);
      }),
    );
  }
}
