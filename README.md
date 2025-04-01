# CDN Worker

A simple CDN made using Cloudflare Workers, Cloudflare R2, and Hono.

## Prerequisites
- A Cloudflare account
- R2 Plan (starts of free)
- KV namespace

## Installation 

To follow the instructions below, you must have Node.js installed. Additionally, I will be showing any terminal commands using Yarn (my preferred package manager) but any Node.js package manager will work with slight modifications.

1. Download the project onto your machine by downloading the ZIP file and extracting it, or forking and then cloning the project using Git.
2. Open a terminal in the location of the project and run `yarn install` (or `yarn` for short) to install the required dependencies.
3. Login to Cloudflare by running `yarn wrangler login`, which will ask you to give permission to wrangler.
4. Create the R2 bucket by running `yarn wrangler r2 bucket create cdn` if it doesn't already exist. If you get an error saying something along the lines of purchasing or upgrading, then you will need to go to your Cloudflare dashboard and click "R2 Object Storage" on the left (towards the bottom). Don't worry, R2 starts off being free for the first 10GB of storage. You can see the pricing here: https://developers.cloudflare.com/r2/pricing/#r2-pricing
4. Create the KV namespace by running `yarn wrangler kv namespace create cdn_users` (for this one, the name can be anything you like) if one doesn't already exist. Alternatively, you can do this on the Cloudflare dashboard via "Storage & Databases" followed by "KV". Upon completion, you will receive an ID that will need to be set inside [wrangler.toml](/wrangler.toml#L10). The existing preview ID can be removed as you will not need it, for example: `{ binding = "CDN_USERS", id = "your id goes here" }` but do not change the binding! It's important that it remains `CDN_USERS`.
5. Go to the "Account Home" page on your Cloudflare dashboard. At the top, next to your username, click the 3 dots, followed by "Copy Account ID". Next, you will want to go to [wrangler.toml](/wrangler.toml#L6) and replace the existing account ID with yours that you copied. For example: `account_id = "your account id goes here"`
6. Just one more step left to go! Make sure you have saved the changes you've made in [wrangler.toml](/wrangler.toml). Next, run `yarn deploy` which will begin to deploy the Cloudflare worker on your account. Once completed, your CDN is now ready!

### Post Installation Questions

#### How do I add users?

To add users, you must add them to the KV namespace. If you don't already know, KV stands for key/value pair. The key is the user's access token and the value is something to identify them with (eg. username).

Users can be added via your Cloudflare dashboard by going to "Storage & Databases" followed by "KV" and then clicking on the namespace that was just created. As for doing it via the terminal, you would run the following: `yarn wrangler kv key put -binding=CDN_USERS "access token" "user identifier"`.

> [!IMPORTANT]  
> It's important that you create strong access tokens to prevent random people gaining access! I recommend at least 64+ characters! You can use a password manager or password generator to create them.

#### How do I use a custom domain?

To use a custom domain, you will have to go to your Cloudflare dashboard, click on the "Workers & Pages" page and then click on the CDN worker. Once you've done this, you can click "Settings" at the top, where you should see "Domains & Routes". Next, you will click the "+ Add" button on the right, followed by "Custom Domain". Here you will enter one of your domains that you have setup to use Cloudflare. For example, you can enter something like `cdn.mydomain.com`.

#### What happened to the `Deploy to Workers` / `Deploy to Cloudflare` button?

I have decided to remove it because it cannot create a KV namespace or an R2 bucket for you, and thus results in the deploy failing, which I was not aware of originally. It would be great if it could do that and update [wrangler.toml](/wrangler.toml) for you, or at least read the KV namespace ID from environment variables. However, that is not the case.

#### What if I need help?

If you need some help, I can try my best to help but cannot guarantee anything. First, have a look through [existing issues](https://github.com/SerenModz21/cdn-worker/issues) first to make sure someone else hasn't already had the same issue. If it hasn't, then please create a [new issue](https://github.com/SerenModz21/cdn-worker/issues/new) by clicking on the highlighted text. Please explain thoroughly and include images or videos where possible. That way, you'll have a better change of getting a faster solution.

### HTTP Routes

Route          | Description 
---------------|-------------
`GET /`        | Redirects to my website by default. However, you can change it inside [wrangler.toml](/wrangler.toml#L19).
`GET /:key`    | Displays the specified media that has been uploaded publicly.
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
2. Go to ShareX, Destinations, Custom uploader settings and then click Import. You can import from your clipboard, file, or URL.
3. Follow the prompts that it gives you and you should be done. 
