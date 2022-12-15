import { LiteralObject } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import * as Sharp from 'sharp';
import * as dotenv from 'dotenv';
dotenv.config();

const s3 = new AWS.S3({
  secretAccessKey: process.env.AWS_S3_SECRET_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

export async function putImageToS3(
  image: Express.Multer.File,
  fileName: string,
) {
  const test = await s3
    .putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Body: image.buffer,
      ContentType: image.mimetype,
      Key: fileName,
      ACL: 'public-read',
    })
    .promise();

  console.log('test', test);

  if (
    image.originalname.search(
      /\.(gif|jpe?g|tiff|png|webp|bmp|svg|HEIC|blob)$/gi,
    ) !== -1
  ) {
    await generateThumb(image, fileName);
    const putObjects = image['thumbs'].map((item) => {
      return s3
        .putObject({
          ACL: 'public-read',
          Body: item.bufferData,
          Bucket: process.env.AWS_S3_BUCKET,
          ContentType: image.mimetype,
          Key: item.fileName,
        })
        .promise();
    });

    await Promise.all(putObjects);
  }
}

export async function generateThumb(
  image: Express.Multer.File,
  fileName: string,
) {
  const thumbs = process.env.AWS_S3_THUMBS;

  for (const thumb of thumbs) {
    const [w, h] = thumb.split('x');
    let bufferData = image.buffer;

    if (w && h) {
      bufferData = await Sharp(image.buffer)
        .resize(Number(w), Number(h), {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .toBuffer();

      if (!image['thumbs'] || !Array.isArray(image['thumbs']))
        image['thumbs'] = [];

      image['thumbs'].push({
        fileName: `${w}x${h}/${fileName}`,
        bufferData,
      });
    }
  }
}

export function returnPaging(
  data: LiteralObject[],
  totalItems: number,
  params: LiteralObject,
  metadata = {},
) {
  const totalPages = Math.ceil(totalItems / params.pageSize);
  return {
    paging: true,
    hasMore: params.pageIndex < totalPages,
    pageIndex: params.pageIndex,
    totalPages: Math.ceil(totalItems / params.pageSize),
    totalItems,
    data,
    ...metadata,
  };
}

export function returnLoadMore(
  data: LiteralObject[],
  params: LiteralObject,
  metadata = {},
) {
  return {
    paging: true,
    hasMore: data.length === params.pageSize,
    data,
    pageSize: params.pageSize,
    ...metadata,
  };
}

export function assignLoadMore(params: LiteralObject) {
  params.pageSize = Number(params.pageSize) || 10;

  return params;
}

export function assignPaging(params: LiteralObject) {
  params.pageIndex = Number(params.pageIndex) || 1;
  params.pageSize = Number(params.pageSize) || 10;
  params.skip = (params.pageIndex - 1) * params.pageSize;

  return params;
}
