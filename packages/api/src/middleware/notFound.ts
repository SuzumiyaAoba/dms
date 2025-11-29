import type { Context } from 'hono';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { errorResponse } from '../utils/response';

export const notFound = (c: Context) => {
  return errorResponse(
    c,
    ERROR_CODES.NOT_FOUND,
    `Route ${c.req.method} ${c.req.path} not found`,
    HTTP_STATUS.NOT_FOUND,
  );
};
