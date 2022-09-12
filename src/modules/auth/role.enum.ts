export enum Role {
  User = 'user',
  Admin = 'admin',
  SuperAdmin = 'super-admin',
  Worker = 'worker',
}

export class UserJWT {
  address: string;
  role: Role;
}
