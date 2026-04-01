import type { MiddlewareHandler } from "hono";

// cache on the browser for a year and cache on cloudflare for 2 hours
// https://developers.cloudflare.com/cache/about/cache-control#cache-control-directives
export const cacheControl = "public, max-age=31536000, s-maxage=7200";

export function idLength(query: string | undefined, def: number) {
	if (!query || !/^\d+$/.test(query)) return def;

	const num = Number.parseInt(query, 10);
	if (!Number.isSafeInteger(num) || num < 1) return def;
	return num;
}

export function getFileExt(filename: string) {
	const index = filename.lastIndexOf(".");
	if (index <= 0) return "";
	return filename.slice(index);
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
