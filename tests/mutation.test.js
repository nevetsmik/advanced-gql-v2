const gql = require("graphql-tag");
const createTestServer = require("./helper");
const CREATE_POST = gql`
  mutation createPost($input: PostInput!) {
    createPost(input: $input) {
      message
    }
  }
`;

describe("mutations", () => {
  test("createPost", async () => {
    const { mutate } = createTestServer({
      user: { id: 1 },
      models: {
        Post: {
          createOne() {
            return {
              message: "NEW_POST",
            };
          },
        },
      },
    });

    const res = await mutate({ query: CREATE_POST, variables: { input: { message: "NEW_POST" } } });
    expect(res).toMatchSnapshot();
  });
});
