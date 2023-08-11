import type { MiddlewareHandler } from "hono";
import { Toucan } from "toucan-js"

export type Options = {
    Bindings: {
        MY_BUCKET: R2Bucket;
        CDN_USERS: KVNamespace;
        SENTRY_DSN: string;
    };
    Variables: {
        user: string;
        sentry: Toucan;
    };
};

export type Middleware = MiddlewareHandler<Options>;

export function idLenth(query: string | undefined, def: number) {
    const id = query ? parseInt(query) : null;
    if (!id || isNaN(id)) return def;
    return id;
}

export function auth(): Middleware {
    return async (c, next) => {
        const missingAccess = () =>
            c.json({ success: false, error: "Missing Access" }, 401);

        const header = c.req.header("Access-Token");
        if (!header) return missingAccess();

        const user = await c.env.CDN_USERS.get(header);
        if (!user) return missingAccess();

        c.set("user", user);

        return next();
    };
}

export function cache(): Middleware {
    return async (c, next) => {
        const key = c.req.url;
        const cache = await caches.open("cdn:images");
        const response = await cache.match(key);

        if (response) {
            const ifNoneMatch =
                c.req.header("If-None-Match") || c.req.header("if-none-match");
            const etag =
                response.headers.get("ETag") || response.headers.get("etag");

            if (ifNoneMatch === etag) {
                return new Response(null, {
                    status: 304,
                    statusText: "Not Modified",
                    headers: response.headers
                });
            }

            return response;
        }

        await next();

        c.executionCtx.waitUntil(cache.put(key, c.res.clone()));
    };
}

export function sentry(): Middleware {
    return async (c, next) => {
        if (!c.env.SENTRY_DSN) return next();

        let hasExecutionContext = true

        try {
            c.executionCtx
        } catch {
            hasExecutionContext = false
        }

        const sentry = new Toucan({
            dsn: c.env.SENTRY_DSN,
            request: c.req.raw,
            context: hasExecutionContext ? c.executionCtx : undefined,
        });

        c.set("sentry", sentry);

        await next();

        if (c.error) {
            sentry.captureException(c.error);
        }
    }
}
