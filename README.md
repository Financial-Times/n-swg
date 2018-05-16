#  Subscribe with Google (SwG) [![CircleCI](https://circleci.com/gh/Financial-Times/n-swg.svg?style=svg&circle-token=53194bdb41b629f6e3696ccfdb2a2492a12b7360)](https://circleci.com/gh/Financial-Times/n-swg)
[![npm version](https://badge.fury.io/js/%40financial-times%2Fn-swg.svg)](https://badge.fury.io/js/%40financial-times%2Fn-swg)

**This is a public repository.**

As well as containing the source code for `n-swg` this repo acts as a documentation source for SwG on FT.com.

#### Contents
- [What is SwG](#what-is-swg)
- [`n-swg` Client](#n-swg-client)
- [`n-swg` API](#n-swg-api)
- [JSON-LD Markup](#json-ld-markup)
- [SwG on AMP](#swg-on-amp)
- [SwG on mobile apps](#swg-on-mobile-apps)
- [SKUs](#skus) 

## What is SwG?

Subscribe with Google or SwG (pronounced "swig") is a Google platform that allows users to subscribe (register + pay) using their Google account and payment methods.

The integral parts include:

- Interfacing with a client side js ("`swg-js`") library (wrapped by `n-swg`).
- Marking up our content with metadata that details its access level ([`next-json-ld`](https://github.com/Financial-Times/next-json-ld)).
- Several APIs on both the Google side and the FT core (Membership) side as detailed [here](https://developers.google.com/news/subscribe/guides/overview): "Subscription Linking API", "Entitlements API" & "Subscription Status API".
- *For FT.com we also have a "post-swg-purchase" form which gathers additional consent ([`next-profile`](https://github.com/Financial-Times/next-profile)), which we cannot gather in the SwG buy flow itself.*

Benefits of SwG include:

- Frictionless purchase
- Frictionless sign in
- SwG users with an FT.com subscription will see prominent placement of FT articles on Google search results
- The flexibility to place the "buy flow" on any webpage (in article purchases etc)

**Subscribe with Google is not "Sign in with Google"**. The ability to sign in with a Google account was a prerequisite to SwG. All SwG users can "Sign in with Google". But not all users who use "Sign in with Google" are SwG users.


### Resources
- [Official Google Docs](https://developers.google.com/news/subscribe/)
- The SwG client library source code [GitHub repository](https://github.com/subscriptions-project/swg-js)
- This README acts as the FT.com documentation
- Please contact #ft-next-conversion with any questions

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
+ `skus` - A comma separated list of what Google knows as the sku. If only one sku is passed, it will immediately open the subscribe popup, otherwise it will call the `showOffers` flow. These will likely be something of the form: `ft.com_<OFFER-ID>_<PAYMENT-TERM>...` [described here](#skus).

**build service** (or manual markup)

Just replicate this basic html. Note that it is disabled by default (so we can check entitlements before enabling).

```html
<button class="swg-button" disabled
	data-trackable="swg-<APP_NAME>"
	data-n-swg-button=""
	data-n-swg-button-skus="<EXAMPLE_SKU_1>,<EXAMPLE_SKU_2>">
	title="Subscribe with Google">
</button>
```

## n-swg API

### Initialising

#### Options Object
```javascript
{
manualInitDomain: 'ft.com',
/* [optional] if provided swg will be imported in manual mode and inited
with the provided domain (it only works for ft.com at the time of writing).
If not passed the config will be pulled by swg-js from JSON-LD markup.
It is important to note that SwG will not work if it cannot find config */

sandbox: false,
/* [optional] if true imports the sandbox version of swg.js */

subscribeFromButton: true,
/* [optional] if true checkout flow will be initiated by clicking on
[data-n-swg-button] elements */

M_SWG_SUB_SUCCESS_ENDPOINT: 'www.ft.com/some-ft-com-url'
/* [optional] if provided this is the CORS endpoint n-swg will call upon a
successful swg subscription event response */
},

M_SWG_ENTITLED_SUCCESS_ENDPOINT: 'www.ft.com/some-ft-com-url'
/* [optional] if provided this is the CORS endpoint n-swg will call upon a
successful entitlements check event response */
},

POST_SUBSCRIBE_URL: 'www.ft.com/some-ft-com-url'
/* [optional] if provided this is the endpoint n-swg will call upon a
successful subscription confirmation */
},

handlers: {
	onSubscribeResponse: (args) => console.log('Welcome to the FT')
}
/* [optional] An object containing custom callback functions. See the
SwgController constructor for available handlers */
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

Should you encounter the case where you only require the swg-js client library, you can do so by calling the following:

```
const loadOptions = {
	manual: true
}
nSwG.importClient(loadOptions);
```

### Methods

```javascript
swgLoader(options).then(swg => {
	// use swg methods
});
```

#### `swg.init({ disableEntitlementsCheck: <BOOLEAN> })`
Initialise swg. This will ensure the swg-js client is loaded and inited according to the load options provided via swgLoader.

And if `disableEntitlementsCheck`=`false` (default)

- check for user entitlements
	- if none are found, init any swg buttons on the page
	- if entitlements are found then it will resolve the users session and either prompt them to log in or automatically log them in. If this is a new user they will be prompted to complete the `/profile` consent form after successful login.

If `disableEntitlementsCheck`=`true`

- init any swg buttons on the page


#### `swg.swgClient`
This exposes the swg-js client for direct usage should you want.



# JSON-LD Markup
Please see [`next-json-ld` README](https://github.com/Financial-Times/next-json-ld/blob/master/README.md#subscribe-with-google-swg-markup) for a detailed description of the markup required on our articles and barriers.

The swg library requires markup to work. So if there is no markup available (e.g a standalone page) then the client should be initialised in "manual" mode.


# SwG on AMP
In progress.


# SwG on mobile apps
It is important that any user with a SwG subscription is able to access content they are entitled to. This **should** always be possible via "Sign in with Google", assuming they created their account on desktop.

Aside from this we do not currently actively support SwG flows on mobile. If we were to there are two main parts.

### Entitlements checking
If an app user lands on a barrier then ideally we can follow the entitlement check and account resolution flows. This could not use the swg-js solution as the android app uses webview and so the sandboxed environment would render the swg-js client un-usable. It is a similar story for iOS.

Therefore if we want to pursue this we must wait for Google to document how we can do native android app entitlement checking (and iOs).

### SwG purchase flows
Users who purchase via their web browser will be able to use SwG and sign in with Google.

We are not able to sell subscriptions directly on our **iOS** app. So it is a non issue.

On **android** we currently link off to the barrier page in webview, swg-js would not work in this scenario due to the sandboxed nature. So again we would need to wait for Google to document how we can do this natively on android.

# SKUs
Think of SKUs as the Google equivalent of our offers.

Each FT.com offer has a unique id. e.g `713f1e28-0bc5-8261-f1e6-eebab6f7600e`, within this offer there may be data about a monthly payment option (`p1m`) or an annual payment option (`p1y`), (or both). If the offer has a "trial" period there would also be data about the trial payment and term.

For our Google SKUs we base the pricing upon an existing offer. This task is completed by the pricing team, setting the price for each supported currency / region as well as the pre-tax default GBP price. These are likely exported as a spreadsheet and the SKUs will need to be manually configured via the "in-app products" section of the play store console.

It is important for tracking purposes that SKU ids follow a strict structure:

```
ft.com_OFFER.ID_TERM_NAME.TRIAL_DATE

[ domain, offerId, termCode, name, date ]
```

Each section is delimited by `_` and data with that section is delimited with `.`
- **domain** - 'ft.com', this never changes (although perhaps we will have `markets.ft.com` packages in the future etc).
- **offerId** - the offerId with the `-` replaced by `.` e.g `713f1e28-0bc5-8261-f1e6-eebab6f7600e` becomes `713f1e28.0bc5.8261.f1e6.eebab6f7600e`.
- **termCode** - the payment term code. `p1m` = "pay 1 month", `p1y` = "pay 1 year". other examples `p3m` = "pay 3 weeks" etc. Main two use cases are `p1m` aka monthly and `p1y` aka annual.
- **name** - the name of the package, usually `standard` or `premium`, if you want a longer name with spaces use `.` e.g `standard.digital.package` -> "standard digital package".
  - it is important to include either `standard` or `premium`
  - if the sku has a trial attatched to it then trial should feature in the name. e.g `standard.trial`
- **date** - the date on which the sku was set up, taking the format: `YYYY.MM.DD`. This helps keep the names unique and easy to reason about

Examples:
```
ft.com_abcd38.efg89_p1m_premium.trial_2018.05.31
ft.com_abcd38.efg89_p1y_standard_2018.05.31
```

We extract tracking data from the sku id. example `ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m_premium.trial_DATE` would have the following tracking properties extracted:

```javascript
{
  offerId: '41218b9e-c8ae-c934-43ad-71b13fcb4465',
  skuId: 'ft.com_41218b9e.c8ae.c934.43ad.71b13fcb4465_p1m_premium.trial_DATE',
  productName: 'premium trial',
  term: 'trial',
  productType: 'Digital',
  isTrial: true,
  isPremium: true
}
```
