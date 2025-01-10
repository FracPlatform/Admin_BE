import { Test, TestingModule } from '@nestjs/testing';
import { IaoEventService } from './iao-event.service';

describe('IaoEventService', () => {
  let service: IaoEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IaoEventService],
    }).compile();

    service = module.get<IaoEventService>(IaoEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
