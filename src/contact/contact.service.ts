import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  create(createContactDto: CreateContactDto) {
    // This logs the incoming data to the terminal
    console.log('New Contact Submission Received:', createContactDto);
    
    // Return a success message to the frontend
    return {
      message: 'Contact form submitted successfully!',
      data: createContactDto
    };
  }
}