# CDN Worker

A simple CDN made using Cloudflare Workers, Cloudflare R2, and Hono.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/SerenModz21/cdn-worker)

## Prerequisites
- A Cloudflare account
- R2 Plan (starts of free)
- KV namespace

## Installation

The easiest method is to click the Deploy with Workers button above and going through the installation steps provided by Cloudflare.

There will not be a manual installation guide as of now but one may be added in the future. However, if you need any help or have any questions, free feel to create an issue and I will try my best to help you out.

As for the KV namespace, the key should be the user's access token and some sort of user identification for the value. For example: the name of the user.

### HTTP Routes

Route          | Description 
---------------|-------------
`GET /`        | Redirects to my website by default. However, you can change it inside [wrangler.toml](/wrangler.toml#L26).
`GET /:key`    | Displays the speciified media that has been uploaded, __publicly__.
`POST /upload` | Uploads media to the CDN. The `Access-Token` header is required!
`DELETE /:key` | Deletes media with the given key, from the CDN. The `Access-Token` header is required!

### ShareX Config Example

```json
{
  "Version": "14.0.1",
  "Name": "cdn",
  "DestinationType": "ImageUploader, TextUploader, FileUploader",
  "RequestMethod": "POST",
  "RequestURL": "https://your.domain/upload",
  "Headers": {
    "Access-Token": "Recommended to be 64+ characters"
  },
  "Body": "MultipartFormData",
  "FileFormName": "image",
  "URL": "{json:url}",
  "DeletionURL": "{json:url}",
  "ErrorMessage": "{json:error}"
}
```

If you wish to use the example above:
1. Set `RequestURL` to be the domain you are using, and `Access-Token` to the one you created in your KV namespace.
2. Go to ShareX, Destinations, Custom uploader settings and then click Import. You can import from clipboard, file, or URL.
3. Follow the prompts that it gives you and you should be done. 
