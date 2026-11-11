import { Controller, Get } from '@nestjs/common';
import type { TvSlideDTO } from '@macondo/shared';
import { TvService } from './tv.service';

@Controller('tv')
export class TvController {
  constructor(private readonly tv: TvService) {}

  @Get('schedule')
  schedule(): Promise<TvSlideDTO[]> {
    return this.tv.schedule();
  }
}
