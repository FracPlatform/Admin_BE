import { HttpException, HttpStatus } from '@nestjs/common';

export class DeactiveAccountException extends HttpException {
  constructor() {
    super(
      {
        code: '',
        message: "Account is deactive.",
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
