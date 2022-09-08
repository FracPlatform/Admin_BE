import { IIPFS } from './ipfs.type';
import axios from 'axios';

export class IpfsNFTStorage implements IIPFS {

  public async upload(content: Express.Multer.File) {
    const response: any = await axios({
      method: 'post',
      url: 'https://api.nft.storage/upload',
      maxContentLength: 104857600,
      maxBodyLength: 104857600,
      headers: {
        Authorization: `Bearer ${process.env.IPFS_NFT_STORAGE_API_KEY}`,
        'Content-Type': content.mimetype,
      },
      data: content.buffer,
    });
    if (response.status === 200) {
      return response.data.value.cid;
    } else {
      throw new Error(response.statusText);
    }
  }

  public async uploadFromURL(url: string, mimeType: any) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'utf-8');
    return this.upload({
      buffer,
      mimetype: mimeType,
    } as any);
  }
}
