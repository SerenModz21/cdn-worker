import type { Middleware } from "./utils";

export function auth(): Middleware {
	return async (c, next) => {
		const missingAccess = () => {
			return c.json({ success: false, error: "Missing Access" }, 401);
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
		const req = c.req.raw;
		const cache = caches.default;
		const response = await cache.match(req);

		if (response) {
			// headers are immutable, so we need to clone the headers
			// to add the Accept-Ranges header for range requests
			const headers = new Headers(response.headers);
			headers.set("Accept-Ranges", "bytes");

			if (c.req.header("If-None-Match") === response.headers.get("ETag")) {
				return new Response(null, {
					status: 304,
					statusText: "Not Modified",
					headers,
				});
			}

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		}

		await next();

		// only cache successful responses
		if (c.res.ok) {
			c.executionCtx.waitUntil(cache.put(req, c.res.clone()));
		}
	};
}
