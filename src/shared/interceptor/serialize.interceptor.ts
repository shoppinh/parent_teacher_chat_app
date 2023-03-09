import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass } from 'class-transformer';

interface ClassConstructor {
  new (...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((result: any) => {
        let { data } = result;
        if (data?.data && data?.totalItem >= 0) {
          data.data = plainToClass(this.dto, result.data.data, {
            excludeExtraneousValues: true,
          });
        } else {
          data = plainToClass(this.dto, result.data, {
            excludeExtraneousValues: true,
          });
        }
        return { ...result, data };
      }),
    );
  }
}
