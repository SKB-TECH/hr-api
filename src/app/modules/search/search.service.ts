import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async search(
    term: string,
    requestedLimit = 6,
    type: 'all' | 'jobs' | 'companies' | 'people' = 'all',
    location = '',
  ) {
    const q = term.trim();
    if (q.length < 2) return { jobs: [], companies: [], candidates: [] };
    const pattern = `%${q}%`;
    const locationPattern = `%${location.trim()}%`;
    const limit = Math.min(Math.max(requestedLimit || 6, 1), 20);
    const [jobs, companies, candidates] = await Promise.all([
      type === 'all' || type === 'jobs'
        ? this.dataSource.query(
            `SELECT j.id, j.title, j.location, c.name AS "companyName", c.logo AS "companyLogo" FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.deleted_at IS NULL AND j.status = 'LIVE' AND (j.title ILIKE $1 OR j.description ILIKE $1 OR j.location ILIKE $1 OR c.name ILIKE $1) AND ($2 = '%%' OR j.location ILIKE $2) ORDER BY j.posted_at DESC NULLS LAST LIMIT $3`,
            [pattern, locationPattern, limit],
          )
        : Promise.resolve([]),
      type === 'all' || type === 'companies'
        ? this.dataSource.query(
            `SELECT c.id, c.name, c.industry, c.location, c.logo FROM companies c WHERE c.status = 'active' AND c.visibility = 'public' AND (c.name ILIKE $1 OR c.industry ILIKE $1 OR c.location ILIKE $1 OR c.description ILIKE $1) AND ($2 = '%%' OR c.location ILIKE $2) ORDER BY c.name LIMIT $3`,
            [pattern, locationPattern, limit],
          )
        : Promise.resolve([]),
      type === 'all' || type === 'people'
        ? this.dataSource.query(
            `SELECT cp.id, u.full_name AS "fullName", u.avatar, cp.headline, cp.city_name AS "cityName", cp.country_name AS "countryName", p.name AS profession FROM candidate_profiles cp JOIN users u ON u.id = cp.user_id LEFT JOIN professions p ON p.id = u.profession_id WHERE u.deleted_at IS NULL AND cp.profile_visibility = 'public' AND (u.full_name ILIKE $1 OR cp.headline ILIKE $1 OR cp.bio ILIKE $1 OR p.name ILIKE $1) AND ($2 = '%%' OR cp.city_name ILIKE $2 OR cp.country_name ILIKE $2) ORDER BY u.full_name LIMIT $3`,
            [pattern, locationPattern, limit],
          )
        : Promise.resolve([]),
    ]);
    return { jobs, companies, candidates };
  }
}
