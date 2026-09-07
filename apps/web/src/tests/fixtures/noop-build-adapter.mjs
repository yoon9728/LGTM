// Exercises Next's adapter build path without contacting a deployment platform.
const adapter = {
  name: "LGTM local build smoke test",
  async onBuildComplete() {
    // No deployment or artifact mutation: Next must complete packaging itself.
  },
};

export default adapter;
