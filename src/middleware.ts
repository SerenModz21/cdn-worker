import type { Middleware } from "./utils";

export function auth(): Middleware {
    return async (c, next) => {
        const missingAccess = () => {
            c.json({ success: false, error: "Missing Access" }, 401);
        };

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

        if (response && c.req.header("If-None-Match") === response.headers.get("ETag")) {
            return new Response(null, {
                status: 304,
                statusText: "Not Modified",
                headers: response.headers
            });
        }

        await next();

        // only cache successful responses
        if (c.res.ok) {
            c.executionCtx.waitUntil(cache.put(key, c.res.clone()));
        }
    };
}
