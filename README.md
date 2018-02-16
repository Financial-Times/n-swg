#  Subscribe with Google (SwG)

To implement SwG in your app, include the following partial(s) making sure to pass in the required information where applicable:

## Styles

To import the styles, add the following to your `main.scss` file:

```
@import 'n-swg/main';
```

## JS

### Options Object
```javascript
const options = {
	manualInitDomain: 'ft.com', // if provided swg will be imported in manual mode and inited with the provided domain (it only works for ft.com at the time of writing)
	subscribeFromButton: true // if true checkout flow will be initiated by clicking on [data-n-swg-button] elements
};
```

### Manual
```javascript
import { SwgController } from '@financial-times/n-swg';

// only required when initialising manually
const loadOptions = {
	manual: true // this should be true if passing options.manualInitDomain
};

SwgController.load(loadOptions).then(client => {
	const swg = new SwgController(client, options);
	swg.init();
});
```

### Convenience method
```javascript
import { swgLoader } from '@financial-times/n-swg';

swgLoader(options).then(swg => {
	swg.init();
});
```

#### async
```javascript
import { swgLoader } from '@financial-times/n-swg';

const swg = await swgLoader(options);
swg.init();
```

Note that the swg client must be loaded in first from Google and handlers set up before exposing the class.

### SwG Client

Should you encounter the case where you need to manually pull in the client, you can do so by calling the following:

```
const loadOptions = {
	manual: true
}
nSwG.importClient(loadOptions);
```

## Templates

### Button

```
{{> n-swg/views/button appName="article" sku="premium" manualInit=true }}
```

+ `appName` - The name of the app that's implementing this.
+ `sku` - What Google knows as the sku. This will likely be something of the form: `offerId_paymentTerm`