import { IIPFS } from './ipfs.type';
import axios from 'axios';
const FormData = require('form-data');

export class IpfsPinataCloud implements IIPFS {

  public async upload(content: Express.Multer.File) {
    const data = new FormData();
    data.append('file', content.buffer as any, content.filename);
    const response: any = await axios({
      method: 'post',
      url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
      maxContentLength: 104857600,
      maxBodyLength: 104857600,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
        Authorization: `Bearer ${process.env.IPFS_PINATA_CLOUD_API_KEY}`,
      },
      data: data,
    });
    if (response.status === 200) {
      return response.data.IpfsHash;
    } else {
      console.log('upload(): response = ', response);
      throw new Error(response.statusText);
    }
  }

  public async uploadFromURL(url: string, mimeType: any) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'utf-8');
    return this.upload({
      buffer,
      mimetype: mimeType,
      filename: new Date().valueOf().toString(),
    } as any);
  }
}
