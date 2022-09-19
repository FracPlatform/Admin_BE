import { HttpException, HttpStatus } from '@nestjs/common';

export class UnverifyEmailException extends HttpException {
  constructor() {
    super(
      {
        code: '',
        message: "Email isn't verified.",
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
