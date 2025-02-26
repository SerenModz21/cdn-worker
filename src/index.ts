import { Hono } from "hono";
import { nanoid } from "nanoid";

import { cacheControl, getFileExt, idLength, type Options } from "./utils";
import { cache, auth } from "./middleware";

const app = new Hono<Options>();

app.get("/", (c) => {
    return c.redirect(c.env.REDIRECT_URL || "https://seren.dev", 301);
});

app.get("/:key", cache(), async (c) => {
    const key = c.req.param("key");

    const object = await c.env.CDN_BUCKET.get(key);
    if (!object) {
        return c.json({ success:false, error: "Media not found" });
    }

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "";

    return c.body(data, 200, {
        "Cache-Control": cacheControl,
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${key}"`,
        ETag: object.httpEtag,
    });
});

app.post("/upload", auth(), async (c) => {
    const filename = nanoid(idLength(c.req.header("Name-Length"), 8));
    const { image } = await c.req.parseBody();

    if (!image) {
        return c.json({ success: false, error: "Missing media" }, 400);
    }

    if (!(image instanceof File)) {
        return c.json({ success: false, error: "Invalid media" }, 400);
    }

    const arrayBuffer = await image.arrayBuffer();

    const fileWithExt = `${filename}${getFileExt(image.name)}`;

    const url = new URL(c.req.url);
    url.pathname = `/${fileWithExt}`;

    await c.env.CDN_BUCKET.put(fileWithExt, arrayBuffer, {
        httpMetadata: {
            contentType: image.type,
            cacheControl: cacheControl,
        },
        customMetadata: {
            "Uploaded-By": c.get("user"),
            "Upload-Url": url.toString(),
        },
    });

    return c.json({
        success: true,
        name: filename,
        url: url.toString(),
    });
});

app.delete("/:key", auth(), async (c) => {
    const key = c.req.param("key");

    const object = await c.env.CDN_BUCKET.get(key);
    if (!object) {
        return c.json({ success:false, error: "Media not found" });
    }

    await c.env.CDN_BUCKET.delete(key);

    const cache = await caches.open("cdn:media");
    await cache.delete(c.req.url);

    return c.json({ success: true, name: key });
});

app.onError((error, c) => {
    return c.json({ success: false, error: error.toString() }, 500);
});

app.notFound((c) => {
    return c.json({ success: false, error: "Page not Found" }, 404);
});

export default app;
