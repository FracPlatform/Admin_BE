import { Media } from '../datalayer/model/asset.model';
export class AssetEntity {
    name: string;
    media: Media[];
    category: string;
    isMintNFT: boolean;
    network: string;
    ownershipPrivacy: number;
    description: string;
    previewUrl: string;
    ownerId: string;
    collectionId: string;
    typeId: string;
    specifications: [];
    deleted: boolean;
}

export class AssetForOwnerEntity {
    _id: string;
    name: string;
    photos: [];
    video: {
        url: string,
        type: string
    }
    category: string;
    isMintNFT: boolean;
    network: string;
    ownershipPrivacy: number;
    description: string;
    previewUrl: string;
    ownerId: string;
    typeId: string;
    collectionId: string;
    specifications: [];
    status: number;
    owner: object;
    assetTypeName: string;
}
