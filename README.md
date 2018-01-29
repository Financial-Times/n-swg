# SwG

To implement Subscribe with Google in your app, include the following partial(s) making sure to pass in the required information where applicable:

## Styles

To import the styles, add the following to your `main.scss` file:

```
@import 'n-swg/main';
```

## Button

### JS

```
import { SubscribeButton } from 'n-swg/main';

new SubscribeButton();
```

### Template

```
{{> n-swg/views/button appName="article" sku="premium" }}
```

+ `appName` - The name of the app that's implementing this.
+ `sku` - What Google knows as the sku is what we know as `accessLevel`.

## SwG Client

```
{{> n-swg/views/client }}
```

## Meta tags

**TODO: ** Remove this should Google decide to go with the JSON-LD approach.

```
{{> n-swg/views/meta appName="article" contentAccessLevel="premium" }}
```

+ `appName` - The name of the app that's implementing this. *Note:* Check this is necessary before passing it in.
+ `contentAccessLevel` - Should be one of: `registered`, `subscribed`, or `premium`. Will default to `free` if not passed in.

---

*Note:* This assumes the use of [`n-ui`](https://github.com/Financial-Times/n-ui).