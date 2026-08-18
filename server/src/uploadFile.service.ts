import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

import type { File as MulterFile } from 'multer';

@Injectable()
export class UploadFileService {
  private readonly logger = new Logger(UploadFileService.name);

  async uploadToExternalApi(file: MulterFile): Promise<string[]> {
    const apiUrl = process.env.EXTERNAL_API_UPLOAD_URL;

    if (!apiUrl) {
      throw new InternalServerErrorException(
        'EXTERNAL_API_UPLOAD_URL is not defined',
      );
    }

    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!file?.buffer) {
      throw new InternalServerErrorException(
        'File buffer is not available. Make sure you are using memoryStorage().',
      );
    }

    const form = new FormData();

    form.append('projectName', 'e-com');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    form.append('files', file.buffer, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      filename: file?.originalname,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      contentType: file?.mimetype,
    });

    try {
      const response = await axios.post(apiUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `External upload failed: ${error.message}`,
          error.response?.data,
        );

        throw new InternalServerErrorException(
          error.response?.data || 'Failed to upload file to external API',
        );
      }

      this.logger.error('External upload failed', error);

      throw new InternalServerErrorException(
        'Failed to upload file to external API',
      );
    }
  }
}
