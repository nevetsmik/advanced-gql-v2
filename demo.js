const gql = require("graphql-tag");
const { ApolloServer } = require("apollo-server");

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    createdAt: Int!
  }

  type Settings {
    user: User!
    theme: String!
  }

  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings
  }

  type Mutation {
    settings(input: NewSettingsInput): Settings
  }
`;

const resolvers = {
  Query: {
    me() {
      return {
        id: "1234",
        username: "Steve",
        createdAt: "3134098234098",
      };
    },
    settings(_, { user }) {
      return {
        user,
        theme: "Light",
      };
    },
  },

  Mutation: {
    settings(_, { input }, context) {
      return input;
    },
  },

  Settings: {
    user(settings) {
      return {
        id: "1234",
        username: "Steve",
        createdAt: "3134098234098",
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  async context({}) {
    return {};
  },
});

server.listen().then(({ url }) => console.log(`server at ${url}`));
