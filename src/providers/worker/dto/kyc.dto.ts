export enum StatusKyc {
  INCOMPLETE = 'incomplete',
  WAITING = 'waiting',
  INREVIEW = 'inreview',
  REJECTED = 'rejected',
  APPROVED = 'approved',
}

export class EventKYC {
  guid: string;
  status: StatusKyc;
  clientId: string;
  event: string;
  recordId: string;
  refId: string;
}
