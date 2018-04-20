#  Subscribe with Google (SwG) [![CircleCI](https://circleci.com/gh/Financial-Times/n-swg.svg?style=svg&circle-token=53194bdb41b629f6e3696ccfdb2a2492a12b7360)](https://circleci.com/gh/Financial-Times/n-swg)
[![npm version](https://badge.fury.io/js/%40financial-times%2Fn-swg.svg)](https://badge.fury.io/js/%40financial-times%2Fn-swg)

**This is a public repository.**

#### Contents
- [What is SwG](#what-is-swg)
- [`n-swg` Client](#n-swg-client)
- [`n-swg` API](#n-swg-api)
- [JSON-LD Markup](#json-ld-markup)

## What is SwG?

Subscribe with Google or SwG (pronounced "swig") is a Google platform that allows users to subscribe (register + pay) using their Google account and payment methods.

The integral parts include:

- Interfacing with a client side js library (wrapped by `n-swg`).
- Marking up our content with metadata that details its access level ([`next-json-ld`](https://github.com/Financial-Times/next-json-ld)).
- Several APIs on both the Google side and the FT core (membership) side as detailed [here](https://developers.google.com/news/subscribe/guides/overview): "Subscription Linking API", "Entitlements API" & "Subscription Status API".
- *For FT.com we also have a "post-swg-purchase" form which gathers additional consent ([`next-profile`](https://github.com/Financial-Times/next-profile)), which we cannot gather in the SwG buy flow itself.*

Benefits of SwG include:

- Frictionless purchase
- Frictionless sign in
- SwG users with an FT.com subscription will see prominent placement of FT articles on Google search results
- The flexibility to drop the "buy flow" on any webpage (in article purchases etc)

**Subscribe with Google is not "Sign in with Google"**. The ability to sign in with a Google account was a prerequisite to SwG. All SwG users can "Sign in with Google". But not all users who use "Sign in with Google" are SwG users.


### Resources
- [Official Google Docs](https://developers.google.com/news/subscribe/)
- The SwG client library source code [GitHub repository](https://github.com/subscriptions-project/swg-js)
- This README acts as the FT.com documentation
- Please contact #ft-conversion with any questions

## n-swg client

### Importing JS

This repo's module exports js for use on the client side via `main-client.js` this should be imported via bower, or directly via the origami build service.

**bower**

```javascript
// bower.json
"dependencies": {
	"n-swg": "<VERSION>"
}

// example-client-side.js
import nSwg from 'n-swg';
```

**build service**

```html
// example.html
<script>
	window._onSwgLoadCallback = function (modules) {
		var nSwg = modules['n-swg'];
		// nSwg is ready to use ...
	}
</script>
<script src="https://www.ft.com/__origami/service/build/v2/bundles/js?modules=n-swg@^<VERSION>&polyfills=true&callback=_onSwgLoadCallback"></script>
```

### Importing styles

The only styles exported are for the "Subscribe with Google" cta button and the overlay message component. Therefore you only need to import the styles if you plan on using either of these.


To import the styles via **bower**

```
// example.scss
@import 'n-swg/main';
```

Via the **build service**

```
// example.html
<link rel="stylesheet" href="https://www.ft.com/__origami/service/build/v2/bundles/css?modules=n-swg@<VERSION>"/>
```


### Templates

The only template exported is for the "Subscribe with Google" button.


#### Button

via **bower**

```
{{> n-swg/views/button appName="article" skus="<SKU_ID>" }}
```

+ `appName` - The name of the app that's implementing this.
+ `skus` - A comma separated list of what Google knows as the sku. If only one sku is passed, it will immediately open the subscribe popup, otherwise it will call the `showOffers` flow. These will likely be something of the form: `ft.com_<OFFER-ID>_<PAYMENT-TERM>`.

**build service** (or manual markup)

Just replicate this basic html. Note that it is disabled by default (so we can check entitlements before enabling).

```html
<a class="swg-button" disabled
	data-trackable="swg-<APP_NAME>"
	data-n-swg-button=""
	data-n-swg-button-skus="<EXAMPLE_SKU_1>,<EXAMPLE_SKU_2>">
	Subscribe with Google
</a>
```

## n-swg API

#### Options Object
```javascript
{
manualInitDomain: 'ft.com',
/* [optional] if provided swg will be imported in manual mode and inited
with the provided domain (it only works for ft.com at the time of writing).
If not passed the config will be pulled by swg from JSON-LD markup. */

sandbox: false,
/* [optional] if true imports the sandbox version of swg.js */

subscribeFromButton: true,
/* [optional] if true checkout flow will be initiated by clicking on
[data-n-swg-button] elements */

M_SWG_SUB_SUCCESS_ENDPOINT: '/some-ft-com-url'
/* [optional] if provided this is the CORS endpoint n-swg will call upon a
successful swg subscription event response */
}
```

#### Simple / Convenience method (recommended)
```javascript
import { swgLoader } from 'n-swg';

swgLoader(options).then(swg => {
	swg.init();
});

// async alternative
const swg = await swgLoader(options);
swg.init();
```

#### Manual
Note that the swg client must be loaded in first from Google and relevant handlers set up before exposing the class.

```javascript
import { SwgController } from 'n-swg';

// only required when initialising manually
const loadOptions = {
	manual: true // this should be true if passing options.manualInitDomain
};

SwgController.load(loadOptions).then(client => {
	const swg = new SwgController(client, options);
	swg.init();
});
```

#### SwG Client Library

Should you encounter the case where you need to manually pull in the client library, you can do so by calling the following:

```
const loadOptions = {
	manual: true
}
nSwG.importClient(loadOptions);
```


# JSON-LD Markup
Please see [`next-json-ld` README](https://github.com/Financial-Times/next-json-ld/blob/master/README.md#subscribe-with-google-swg-markup) for a detailed description of the markup required on our articles and barriers.

The swg library requires markup to work. So if there is no markup available (e.g a standalone page) then the client should be initialised in "manual" mode.
