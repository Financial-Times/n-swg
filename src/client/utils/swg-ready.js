module.exports = (_self=self) => new Promise((resolve) => {
	(_self.SUBSCRIPTIONS = _self.SUBSCRIPTIONS || []).push(resolve);
});
