# CDN Worker

A simple CDN made using Cloudflare Workers, Cloudflare R2, and Hono.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/SerenModz21/cdn-worker)

## Prerequisites
- A Cloudflare account
- R2 Plan (starts of free)
- KV namespace

## Installation

The easiest method is to click the Deploy with Workers button above and going through the installation steps provided by Cloudflare.

There will not be a manual installation guide as of now. However, one may be added in the future. I recommend looking at the Cloudflare documentation.

## Example

ShareX file name: `cdn.sxcu`

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

As for the KV namespace, keys should be users' access tokens and some sort of user identification for the value. For example: the users name.
