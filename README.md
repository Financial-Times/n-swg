# SwG

To implement Subscribe with Google in your app, include the following partial(s) making sure to pass in the required information where applicable:

## Meta tags

```
{{> n-swg/meta appName="article" contentAccessLevel="premium" }}
```

+ `appName` (required) - The name of the app that's implementing this.
+ `contentAccessLevel` - Should be one of: `registered`, `subscribed`, or `premium`. Will default to `free` if not passed in.

## Clientside JS

```
{{> n-swg/client }}
```

---

*Note:* This assumes the use of [`n-ui`](https://github.com/Financial-Times/n-ui).


## Entitlements Checking API

`GetEntitlements` is an HTTPS endpoint we host that returns the set of entitlements for a given user.
It accepts either:

- an `FTSession_s` cookie via a CORS request from `ft.com`
- or, an `entitlements_access_token` (previous generated oAuth token given to Google by us)

It returns a `labels` array of user entitlements. These `labels` map directly to the access levels of our content as per `meta` tags.

The endpoint lives in https://github.com/Financial-Times/next-signup-api at `https://next-signup-api.ft.com/swg/get-entitlements`

