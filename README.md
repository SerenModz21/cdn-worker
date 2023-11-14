# CDN Worker

A simple CDN made using Cloudflare Workers, Cloudflare R2, and Hono.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/SerenModz21/cdn-worker)

## Prerequisites
- A Cloudflare account
- R2 Plan (starts of free)
- KV namespace

## Installation

The easiest method is to click the Deploy with Workers button above and going through the installation steps provided by Cloudflare.

There will not be a manual installation guide as of now but one may be added in the future. If you need any help or have any questions, free feel to create an issue and I will try my best to help you out.

As for the KV namespace, keys should be users' access tokens and some sort of user identification for the value. For example: the users name.


## Example

ShareX example:

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
1. Set the RequestURL and Access-Token to the domain you are using, and the Access-Token to the one you created.
2. Go to ShareX, Destinations, Custom uploader settings and then click Import. You can import from clipboard, file, or URL.
3. Follow the prompts that it gives you and you should be done. 
