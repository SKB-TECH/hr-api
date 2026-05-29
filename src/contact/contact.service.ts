import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  create(createContactDto: CreateContactDto) {
    return {
      message: 'Contact form submitted successfully!',
      data: createContactDto,
    };
  }
}
