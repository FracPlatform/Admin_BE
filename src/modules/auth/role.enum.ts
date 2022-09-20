export enum Role {
  SuperAdmin = 1,
  OperationAdmin = 2,
  HeadOfBD = 3,
  FractorBD = 4,
  MasterBD = 5,
  OWNER = 100,
  WORKER = 101,
}

export class UserJWT {
  address: string;
  role: Role;
}
