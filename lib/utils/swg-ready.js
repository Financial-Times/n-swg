module.exports = new Promise((resolve) => {
  (self.SUBSCRIPTIONS = self.SUBSCRIPTIONS || []).push(resolve);
});
