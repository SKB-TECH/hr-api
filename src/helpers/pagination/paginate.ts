import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationDto } from './pagination.dto';
import { PaginatedResult } from './paginated-result.interface';

const DEFAULT_SORTABLE = [
  'id',
  'createdAt',
  'updatedAt',
  'name',
  'email',
  'status',
  'key',
  'code',
];

export async function paginate<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  dto: PaginationDto,
  allowedSortColumns?: string[],
): Promise<PaginatedResult<T>> {
  const { page, limit, sortBy, order } = dto;

  if (sortBy) {
    const whitelist = allowedSortColumns || DEFAULT_SORTABLE;
    if (whitelist.includes(sortBy)) {
      const alias = queryBuilder.alias;
      queryBuilder.orderBy(`${alias}.${sortBy}`, order);
    }
  }

  queryBuilder.skip((page - 1) * limit).take(limit);

  const [data, total] = await queryBuilder.getManyAndCount();

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
