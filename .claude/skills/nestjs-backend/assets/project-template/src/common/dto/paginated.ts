import { PageMeta } from '../types/api-response';

/** Services return Paginated<Dto>; the envelope interceptor lifts meta out. */
export class Paginated<T> {
  constructor(
    readonly data: T[],
    readonly meta: PageMeta,
  ) {}

  static of<T>(data: T[], totalItems: number, page: number, limit: number): Paginated<T> {
    return new Paginated(data, {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    });
  }
}
