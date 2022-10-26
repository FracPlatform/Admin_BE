export class SocialLink {
  type: string;
  url: string;
}

export class CollectionItem {
  name: string;
  isDefault: boolean;
}

export class FractorEntity {
  fractorId?: string;
  email: string;
  password: string;
  verified: boolean;
  kycStatus: boolean;
  verificationCode: number;
  verificationCodeExpireTime: Date;
  fullname: string;
  description: string;
  avatar: string;
  socialLink: SocialLink[];
  banner: string;
  socialFacebookId: string;
  referBy: string;
  collections: CollectionItem[];
  isBlocked: boolean;
  assignedBD: string;
  iaoFeeRate: number;
  tradingFeeProfit: number;
  lastUpdatedBy: string;
  deactivatedBy: string;
  deactivetedOn: Date;
  deactivationComment: string;
}

export class Profile {
  email: string;
  fullname: string;
  description: string;
  avatar: string;
  socialLink: SocialLink[];
  banner: string;
  referBy: string;
  collections: CollectionItem[];
  isKYC: boolean;
  fractorId: string;
  contactPhone: object;
  walletAddress: string;
  fractorAddress: string;
}

export class FacebookDetail {
  email: string;
  firstName: string;
  lastName: string;
  id: string;
}

export class GoogleAccountDetail {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}
