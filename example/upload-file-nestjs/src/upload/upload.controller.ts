import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as md5 from 'md5';
import { putImageToS3, returnLoadMore } from 'src/helpers/utils';
dotenv.config();

@Controller('upload')
export class UploadController {
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
    const results = [];

    for (const file of files) {
      if (
        file.originalname.search(
          /\.(gif|jpe?g|tiff|png|webp|bmp|svg|HEIC|blob)$/gi,
        ) === -1
      ) {
        throw new Error(
          'only upload file gif|jpe?g|tiff|png|webp|bmp|svg|HEIC|blob',
        );
      }

      const arr_ext = (file.originalname || '').split('.');
      const originalName = md5(file.originalname);

      const md5Name = arr_ext.length
        ? `${originalName}.${arr_ext[arr_ext.length - 1]}`
        : originalName;

      const fileName = `${Date.now().toString()}-${md5Name}`;

      await putImageToS3(file, fileName);
      results.push(fileName);
    }

    return returnLoadMore(results, {}, { domain: process.env.AWS_S3_BUCKET });
  }
}
