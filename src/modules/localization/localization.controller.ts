import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { LocalizationService } from './localization.service';

@ApiTags('Localization') // Keeps Swagger documentation clean
@Controller('api/v1/localization')
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get a list of all countries' })
  getCountries() {
    return {
      success: true,
      data: this.localizationService.getCountries(),
    };
  }

  @Get('countries/:countryCode/cities')
  @ApiOperation({ summary: 'Get a list of cities for a specific country' })
  @ApiParam({ 
    name: 'countryCode', 
    example: 'RW', 
    description: 'The 2-letter ISO code of the country (e.g., RW for Rwanda, US for United States)' 
  })
  getCities(@Param('countryCode') countryCode: string) {
    return {
      success: true,
      data: this.localizationService.getCitiesByCountry(countryCode),
    };
  }
}
