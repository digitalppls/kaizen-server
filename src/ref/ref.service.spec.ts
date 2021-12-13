import { Test, TestingModule } from '@nestjs/testing';
import { RefService } from './ref.service';

describe('RefService', () => {
  let service: RefService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefService],
    }).compile();

    service = module.get<RefService>(RefService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
