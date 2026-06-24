import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { DocumentView, OkResponse } from '@workarmy/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { FilesService, type UploadedFileLike } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  // 15MB hard cap to protect memory; the service enforces the configured limit precisely.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: { sub: string },
    @UploadedFile() file: UploadedFileLike,
    @Query('kind') kind?: string,
  ): Promise<DocumentView> {
    return this.files.upload(user.sub, file, kind);
  }

  @Get('me')
  listMine(@CurrentUser() user: { sub: string }): Promise<DocumentView[]> {
    return this.files.listMine(user.sub);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<OkResponse> {
    return this.files.remove(user.sub, id);
  }

  // Public capability URL — the document uuid is the secret. Lets <img>/<a> and the
  // public resume page load files without an auth header.
  @Public()
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const f = await this.files.resolve(id);
    if (f.mimeType) res.type(f.mimeType);
    res.sendFile(f.absPath);
  }
}
