import type { MiddlewareHandler } from "hono";

// cache on the browser for a year and cache on cloudflare for 2 hours
// https://developers.cloudflare.com/cache/about/cache-control#cache-control-directives
export const cacheControl = "public, max-age=31536000, s-maxage=7200";

export function idLenth(query: string | undefined, def: number) {
    const id = query ? parseInt(query) : null;
    if (!id || isNaN(id)) return def;
    return id;
}

export type Options = {
    Bindings: {
        CDN_BUCKET: R2Bucket;
        CDN_USERS: KVNamespace;
        REDIRECT_URL?: string;
    };
    Variables: {
        user: string;
    };
};

export type Middleware = MiddlewareHandler<Options>;
