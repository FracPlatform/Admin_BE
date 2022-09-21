import { Role } from 'src/modules/auth/role.enum';

export class ProfileAdmin {
  email: string;
  fullname: string;
  description: string;
  referral: string;
}

export class AdminEntity {
  email: string;
  fullname: string;
  description: string;
  walletAddress: string;
  role: Role;
  status: number;
  referral: string;
  createBy: string;
  lastUpdateBy: string;
  deactivateBy: string;
  adminId?: string;
  deleted: boolean;
}

export class ListAdminEntity {
  _id: string;
  email: string;
  fullname: string;
  description: string;
  walletAddress: string;
  role: Role;
  status: number;
  referral: string;
  createBy: string;
  lastUpdateBy: string;
  adminId?: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AdminDetailEntity {
  _id: string;
  email: string;
  fullname: string;
  description: string;
  walletAddress: string;
  role: Role;
  status: number;
  referral: string;
  adminCreated: object;
  adminUpdated: object;
  adminDeactivated: object;
  adminId?: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}