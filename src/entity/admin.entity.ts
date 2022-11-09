import { Role } from 'src/modules/auth/role.enum';

export class ProfileAdmin {
  email: string;
  fullname: string;
  description: string;
  referral: string;
  walletAddress: string;
  role: Role;
  adminId?: string;
  commissionRate?: number;
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
  adminId?: string;
  deleted: boolean;
  commissionRate?: number;
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
  commissionRate?: number;
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
  adminId?: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  commissionRate?: number;
}

export class InformationAdmin {
  email: string;
  fullname: string;
  description: string;
  adminId: string;
  role: number;
  commissionRate?: number;
}