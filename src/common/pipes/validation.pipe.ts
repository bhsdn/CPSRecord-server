import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
// 全局参数校验管道，自动把请求体转成 DTO 并抛出友好错误
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    // 原始类型不需要校验，直接返回
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 将普通对象转换成对应 DTO，支持自动类型转换
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      // 整理 class-validator 的错误信息并直接抛出 400
      const messages = errors
        .map((err) => Object.values(err.constraints ?? {}))
        .flat();
      throw new BadRequestException(messages);
    }
    return object;
  }

  private toValidate(metatype: any): boolean {
    // 内置类型不需要再经过 DTO 校验
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
