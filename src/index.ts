import { Hono } from "hono";
import { nanoid } from "nanoid";
import { Path } from "@lifaon/path";

import { cacheControl, idLenth, type Options } from "./utils";
import { cache, auth } from "./middleware";

const app = new Hono<Options>();

app.get("/", (c) => {
    return c.redirect(c.env.REDIRECT_URL || "https://www.serenmodz.rocks", 301);
});

app.get("/:key", cache(), async (c) => {
    const key = c.req.param("key");

    const object = await c.env.CDN_BUCKET.get(key);
    if (!object) return c.notFound();

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "";

    return c.body(data, 200, {
        "Cache-Control": cacheControl,
        "Content-Type": contentType,
        ETag: object.httpEtag,
    });
});

app.post("/upload", auth(), async (c) => {
    const filename = nanoid(idLenth(c.req.header("Name-Length"), 8));
    const { image } = await c.req.parseBody();

    if (!image) return c.notFound();

    if (!(image instanceof File)) {
        return c.json({ success: false, error: "Invalid media" }, 400);
    }

    const arrayBuffer = await image.arrayBuffer();

    const { ext } = new Path(image.name).stemAndExtOrThrow();
    const fileWithExt = filename + ext;

    const url = new URL(c.req.url);
    url.pathname = "/" + fileWithExt;

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
        name: image.name,
        url: url.toString(),
    });
});

app.delete("/:key", auth(), async (c) => {
    const key = c.req.param("key");

    await c.env.CDN_BUCKET.delete(key);

    return c.json({ success: true, name: key });
});

app.onError((error, c) => {
    return c.json({ success: false, error: error.toString() }, 500);
});

app.notFound((c) => {
    return c.json({ success: false, error: "Page not Found" }, 404);
});

export default app;
