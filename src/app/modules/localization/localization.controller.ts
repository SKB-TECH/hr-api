import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { LocalizationService } from './localization.service';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Localization')
@Controller('api/v1/localization')
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get a list of all countries' })
  async getCountries() {
    return sendResult(
      HttpStatus.OK,
      'Countries fetched',
      this.localizationService.getCountries(),
    );
  }

  @Get('countries/:countryCode/cities')
  @ApiOperation({ summary: 'Get a list of cities for a specific country' })
  @ApiParam({
    name: 'countryCode',
    example: 'RW',
    description:
      'The 2-letter ISO code of the country (e.g., RW for Rwanda, US for United States)',
  })
  async getCities(@Param('countryCode') countryCode: string) {
    return sendResult(
      HttpStatus.OK,
      'Cities fetched',
      this.localizationService.getCitiesByCountry(countryCode),
    );
  }
}
