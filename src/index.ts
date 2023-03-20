import { Hono, type MiddlewareHandler } from "hono";
import { cache } from "hono/cache";
import { nanoid } from "nanoid";

type Options = {
    Bindings: {
        MY_BUCKET: R2Bucket;
        CDN_USERS: KVNamespace;
    };
    Variables: {
        user: string;
    };
};

const app = new Hono<Options>();
const cacheControl = "public, max-age=31536000"; // 1 year

app.get("/", (c) => {
    return c.redirect("https://www.serenmodz.rocks", 301);
});

app.get("/:key", cache({ cacheName: "cdn:images", cacheControl }), async (c) => {
    const key = c.req.param("key");

    const object = await c.env.MY_BUCKET.get(key);
    if (!object) return c.notFound();

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "";

    return c.body(data, 200, {
        // "Cache-Control": cacheControl,
        "Content-Type": contentType,
        ETag: object.httpEtag,
    });
});

app.post("/upload", authMiddleware(), async (c) => {
    const filename = nanoid(idLenth(c.req.header("Name-Length"), 8));
    const { image } = await c.req.parseBody();

    if (!image) return c.notFound();

    if (!(image instanceof File))
        return c.json({ success: false, error: "Invalid image" }, 400);

    const arrayBuffer = await image.arrayBuffer();

    const [, extension] = image.type.split("/");
    const fileWithExt = `${filename}.${extension}`;

    const url = new URL(c.req.url);
    url.pathname = `/${fileWithExt}`;

    await c.env.MY_BUCKET.put(fileWithExt, arrayBuffer, {
        httpMetadata: {
            contentType: image.type,
            cacheControl: cacheControl,
        },
        customMetadata: {
            "Uploaded-By": c.get("user"),
            Domain: url.hostname,
        },
    });

    return c.json({
        success: true,
        name: image.name,
        url: url.toString(),
    });
});

app.delete("/:key", authMiddleware(), async (c) => {
    const key = c.req.param("key");

    await c.env.MY_BUCKET.delete(key);

    return c.json({ success: true, name: key });
});

export default app;

function idLenth(query: string | undefined, def: number) {
    const id = query ? parseInt(query) : null;
    if (!id || isNaN(id)) return def;
    return id;
}

function authMiddleware(): MiddlewareHandler<Options> {
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
