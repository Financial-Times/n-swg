# SwG

To implement Subscribe with Google in your app, include the following partial(s) making sure to pass in the required information where applicable:

## Meta tags

```
{{> n-swg/meta appName="article" contentAccessLevel="premium" }}
```

+ `appName` - The name of the app that's implementing this. *Note:* Check this is necessary before passing it in.
+ `contentAccessLevel` - Should be one of: `registered`, `subscribed`, or `premium`. Will default to `free` if not passed in.

## Clientside JS

```
{{> n-swg/client }}
```

---

*Note:* This assumes the use of [`n-ui`](https://github.com/Financial-Times/n-ui).