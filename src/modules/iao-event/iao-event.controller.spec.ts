import { Test, TestingModule } from '@nestjs/testing';
import { IaoEventController } from './iao-event.controller';
import { IaoEventService } from './iao-event.service';

describe('IaoEventController', () => {
  let controller: IaoEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IaoEventController],
      providers: [IaoEventService],
    }).compile();

    controller = module.get<IaoEventController>(IaoEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
