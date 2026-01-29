import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log('Hello from app service!');
    return 'Hello World From NestJS!';
  }
}
