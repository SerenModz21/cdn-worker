import type { Context, MiddlewareHandler } from "hono";

// https://developers.cloudflare.com/cache/about/cache-control#cache-control-directives
export const cacheControl = "public, max-age=31536000";

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

export function getBasename(filename: string) {
	if (!filename.includes("/")) return filename;
	return filename.slice(filename.lastIndexOf("/") + 1);
}

export function doesEtagMatch(c: Context, responseHeaders: Headers) {
	const ifNoneMatch = c.req.header("If-None-Match");
	if (!ifNoneMatch) return false;

	const etag = responseHeaders.get("ETag");
	if (!etag) return false;

	return ifNoneMatch === etag;
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
