const resolvers = require("../src/resolvers");

describe("resolvers", () => {
  test("feed", () => {
    const results = resolvers.Query.feed(null, null, {
      models: {
        Post: {
          findMany() {
            return ["hello"];
          },
        },
      },
    });
    expect(results).toEqual(["hello"]);
  });
});
