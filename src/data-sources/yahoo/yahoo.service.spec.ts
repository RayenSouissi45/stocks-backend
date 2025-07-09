import { Test, TestingModule } from '@nestjs/testing';
import { YahooService } from './yahoo.service';

describe('YahooService', () => {
  let service: YahooService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YahooService],
    }).compile();

    service = module.get<YahooService>(YahooService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
