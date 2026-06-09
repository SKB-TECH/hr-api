import { Injectable, NotFoundException } from '@nestjs/common';

// Use require to avoid missing type declaration errors from the package
// and treat the imports as any. This keeps runtime behavior while
// preventing TS import errors when types are not available.
const { Country, City } = require('country-state-city') as any;

@Injectable()
export class LocalizationService {
  
  // 1. Fetch all countries (perfect for the first dropdown)
  getCountries(): Array<{ name: string; isoCode: string; flag?: string }> {
    const countries: any[] = Country.getAllCountries();

    // Map it so we only send the necessary data to the frontend
    return countries.map((country: any) => ({
      name: country.name,
      isoCode: country.isoCode, // e.g., 'US', 'RW', 'KE'
      flag: country.flag,
    }));
  }

  // 2. Fetch cities based on the selected country (perfect for the second dropdown)
  getCitiesByCountry(countryCode: string): Array<{ name: string; stateCode?: string }> {
    // The library expects a 2-letter ISO code (e.g., 'US', 'RW')
    const cities: any[] = City.getCitiesOfCountry(countryCode.toUpperCase());

    if (!cities || cities.length === 0) {
      throw new NotFoundException(`No cities found for country code: ${countryCode}`);
    }

    // Map it to keep the payload lightweight
    return cities.map((city: any) => ({
      name: city.name,
      stateCode: city.stateCode,
    }));
  }
}
