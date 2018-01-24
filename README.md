# SwG

To implement Subscribe with Google in your app, include the following partial making sure to pass in the required information:

```
{{> n-swg/client.html appName="article" contentAccessLevel="premium" }}
```

+ `appName` (required) - The name of the app that's implementing this.
+ `contentAccessLevel` - Should be one of: `registered`, `subscribed`, or `premium`. Will default to `free` if not passed in.

*Note:* This assumes the use of [`n-ui`](https://github.com/Financial-Times/n-ui).