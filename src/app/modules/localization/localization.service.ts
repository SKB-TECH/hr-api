import { Injectable, NotFoundException } from '@nestjs/common';

const { Country, City } = require('country-state-city') as any;

@Injectable()
export class LocalizationService {
  getCountries(): Array<{ name: string; isoCode: string; flag?: string }> {
    const countries: any[] = Country.getAllCountries();

    return countries.map((country: any) => ({
      name: country.name,
      isoCode: country.isoCode, // e.g., 'US', 'RW', 'KE'
      flag: country.flag,
    }));
  }

  getCitiesByCountry(
    countryCode: string,
  ): Array<{ name: string; stateCode?: string }> {
    const cities: any[] = City.getCitiesOfCountry(countryCode.toUpperCase());

    if (!cities || cities.length === 0) {
      throw new NotFoundException(
        `No cities found for country code: ${countryCode}`,
      );
    }

    return cities.map((city: any) => ({
      name: city.name,
      stateCode: city.stateCode,
    }));
  }
}
