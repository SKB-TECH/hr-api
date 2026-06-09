import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const ResumeFileInterceptor = FileInterceptor('file', {
  fileFilter: (req, file, cb) => {
    // Check for file extensions
    if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
      return cb(
        new BadRequestException('Only PDF and DOC files are allowed'),
        false,
      );
    }
    cb(null, true);
  },
  // Optional: Add limits to prevent massive files from hitting your server
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});