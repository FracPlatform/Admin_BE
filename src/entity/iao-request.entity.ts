import { AssetValuation, Phone } from "src/datalayer/model";

export class IAORequestEntity {
    items: string[];
    assetValuation: AssetValuation;
    totalSupply: number;
    percentOffered: number;
    eventDuration: number;
    percentVault: number;
    walletAddress: string;
    phone: Phone;
    note: string;
    status: number;
    type: number;
    ownerId: string;
    usdPrice: number;
}

export class IAORequestDetailEntity {
    _id: string;
    items: any[];
    assetValuation: AssetValuation;
    totalSupply: number;
    percentOffered: number;
    eventDuration: number;
    percentVault: number;
    walletAddress: string;
    phone: Phone;
    note: string;
    status: string;
    type: number;
    ownerId: string;
    usdPrice: number;
    iaoId?: string;
    createdAt: Date;
    updatedAt: Date;
}