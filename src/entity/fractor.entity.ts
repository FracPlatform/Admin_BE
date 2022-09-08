export class SocialLink {
  type: string;
  url: string;
}

export class CollectionItem {
  name: string;
  isDefault: boolean;
}

export class FractorEntity {
  email: string;
  password: string;
  verified: boolean;
  kycStatus: boolean;
  verificationCode: number;
  verificationCodeExpireTime: Date;
  fullname: string;
  description: string;
  avatar: string;
  socialLink: SocialLink[]
  banner: string;
  socialFacebookId: string;
  referBy: string;
  collections: CollectionItem[];
}

export class Profile {
  email: string;
  fullname: string;
  description: string;
  avatar: string;
  socialLink: SocialLink[]
  banner: string;
  referBy: string;
  collections: CollectionItem[];
}