import { Test, TestingModule } from '@nestjs/testing';
import { RefController } from './ref.controller';

describe('RefController', () => {
  let controller: RefController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefController],
    }).compile();

    controller = module.get<RefController>(RefController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
