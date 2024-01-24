import type { Middleware } from "./utils";

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
        const cache = await caches.open("cdn:media");
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
