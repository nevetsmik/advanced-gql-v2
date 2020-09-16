const gql = require("graphql-tag");
const { ApolloServer, PubSub } = require("apollo-server");

const pubSub = new PubSub({});
const SOME_ITEM = "SOME_ITEM";

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
    createItem(task: String!): Item!
  }

  type Item {
    task: String!
  }

  type Subscription {
    newItem: Item
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
    createItem(_, { task }) {
      const item = {
        task,
      };
      // trigger for when SOME_ITEM is actually created
      // newItem is the data that will be available to every subscription
      pubSub.publish(SOME_ITEM, { newItem: item });
      return item;
    },
  },

  Subscription: {
    // newItem subscription is subscribing to any SOME_ITEM event
    newItem: {
      // resolver for telling the newItem subscription what we are subscribing to - in this example we are subscribing to the SOME_ITEM event.
      subscribe: () => pubSub.asyncIterator(SOME_ITEM),
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
  async context({ connection, req }) {
    if (connection) {
      return { ...connection.context };
    }
  },
  subscriptions: {
    onConnect(params) {},
  },
});

server.listen().then(({ url }) => console.log(`server at ${url}`));
