import { Hono, type MiddlewareHandler, type Context } from "hono";
import { nanoid } from "nanoid";

type Env = {
	MY_BUCKET: R2Bucket;
    CDN_USERS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

const cacheControl = "public, max-age=31536000" // 1 year

const auth: MiddlewareHandler = async (c: Context<{ Bindings: Env }>, next) => {
    const missingAccess = () => c.json({ success: false, error: "Missing Access" }, 401);

    const header = c.req.header("Access-Token");
    if (!header) return missingAccess();

    const user = await c.env.CDN_USERS.get(header);
    if (!user) return missingAccess();

    return next();
};

app.use(async (c, next) => {
    try {
        await next();
    } catch (e) {
        const error = e instanceof Error ? e.message : e;
        return c.json({ success: false, error }, 500);
    }
});

app.get("/", (c) => {
    return c.redirect("https://www.serenmodz.rocks", 301);
});

app.get("/:key", async (c) => {
    const key = c.req.param("key");

    const object = await c.env.MY_BUCKET.get(key);
    if (!object) return c.notFound();

    const data = await object.arrayBuffer();
    const contentType = object.httpMetadata?.contentType || "";

    return c.body(data, 200, {
        "Cache-Control": cacheControl,
        "Content-Type": contentType
    })
});

app.post("/upload", auth, async (c) => {
    const filename = nanoid(idLenth(c.req.header("Name-Length"), 8));
    console.log("filename", filename);
    const { image } = await c.req.parseBody();

    if (!image) return c.notFound();

    if (!(image instanceof File)) return c.json({ success: false, error: "Invalid image" }, 400);

    const arrayBuffer = await image.arrayBuffer()

    const url = new URL(c.req.url);
    url.pathname = `/${filename}`;

    await c.env.MY_BUCKET.put(filename, arrayBuffer, {
        httpMetadata: {
            contentType: image.type,
            cacheControl: cacheControl
        }
    })

    return c.json({
        success: true,
        name: image.name,
        url: url.toString()
    });
});

app.delete("/:key", auth, async (c) => {
    const key = c.req.param("key");
    
    await c.env.MY_BUCKET.delete(key);

    return c.json({ success: true, name: key });
})

export default app;

function idLenth(query: string | undefined, def: number) {
    const id = query ? parseInt(query) : null;
    if (!id || isNaN(id)) return def;
    return id;
}
