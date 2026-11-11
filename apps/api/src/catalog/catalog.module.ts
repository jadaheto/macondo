import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { FileStreamerService } from './file-streamer.service';
import { ThumbnailService } from './thumbnail.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, FileStreamerService, ThumbnailService],
  exports: [CatalogService, FileStreamerService, ThumbnailService],
})
export class CatalogModule {}
