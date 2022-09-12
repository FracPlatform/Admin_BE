import * as dotenv from 'dotenv';
const Web3 = require('web3');
const defaultEnvConfigPath = '.env';
const defaultEnvConfig = dotenv.config({ path: defaultEnvConfigPath });
const web3 = new Web3(Web3.givenProvider || defaultEnvConfig.parsed.BSC_PROVIDER);

export class Web3Utils {
  public static async verifySignatureData(data, sign, address) {
    try {
      console.log(10, data);
      
      const hash = await web3.eth.accounts.recover(data, sign);
      console.log(11, hash);
      
      return hash.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.log('ERROR:', error)
    }
  }
}
