#  Subscribe with Google (SwG)

To implement SwG in your app, include the following partial(s) making sure to pass in the required information where applicable:

## Styles

To import the styles, add the following to your `main.scss` file:

```
@import 'n-swg/main';
```

## JS

```
import nSwG from 'n-swg';

nSwG.init();
```

Note that calling the `init` function will check for the existence of any of the component templates (see below) and initialise any JS that might power said component if necessary.

It will also automatically pull in the SwG client if _any_ components are found.

### SwG Client

Should you encounter the case where you need to manually pull in the client, you can do so by calling the following:

```
nSwG.importClient();
```

## Templates

### Button

```
{{> n-swg/views/button appName="article" sku="premium" }}
```

+ `appName` - The name of the app that's implementing this.
+ `sku` - What Google knows as the sku. This will likely be something of the form: `offerId_paymentTerm`
