import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as not requiring an access token (the global guard skips it). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
