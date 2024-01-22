import { Hono } from "hono";
import { nanoid } from "nanoid";
import { Path } from "@lifaon/path";
import { cache, auth, idLenth, type Options } from "./utils";

const app = new Hono<Options>();

// cache on the browser for a year and cache on cloudflare for 2 hours
// https://developers.cloudflare.com/cache/about/cache-control#cache-control-directives
const cacheControl = "public, max-age=31536000, s-maxage=7200";

app.get("/", (c) => {
    return c.redirect("https://www.serenmodz.rocks", 301);
});

app.get("/:key", cache(), async (c) => {
    const key = c.req.param("key");

    const object = await c.env.MY_BUCKET.get(key);
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

    await c.env.MY_BUCKET.put(fileWithExt, arrayBuffer, {
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

    await c.env.MY_BUCKET.delete(key);

    return c.json({ success: true, name: key });
});

app.onError((error, c) => {
    return c.json({ success: false, error: error.toString() }, 500);
});

app.notFound((c) => {
    return c.json({ success: false, error: "Page not Found" }, 404);
});

export default app;
