const gql = require("graphql-tag");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const { ApolloServer, PubSub, SchemaDirectiveVisitor } = require("apollo-server");

const pubSub = new PubSub({});
const SOME_ITEM = "SOME_ITEM";

// Log the field when it gets resolved
class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    // Allow the client to pass a message arg of type String
    // field.args are what's passed from the query
    // this.args are passed from schema
    field.args.push({ type: GraphQLString, name: "message" });

    // Similar pattern as authentication/authorization
    // 1). Save the old resolver for the field or the default resolver
    // 2). Wrap the old resolve inside a newly defined field.resolve function
    // 3). defaultFieldResolver will map fields from the resolve to fields of query that have the same name
    const oldResolver = field.resolve || defaultFieldResolver;
    field.resolve = (root, { message, ...rest }, ctx, info) => {
      // schemaMessage is "I'm the schema message"
      debugger;
      const { message: schemaMessage } = this.args;
      // message is what the client passed in query id(message: "something")
      console.log(`client message: ${message}`);
      console.log(`schema message: ${schemaMessage}`);
      return oldResolver.call(this, root, rest, ctx, info);
    };
  }
}

const typeDefs = gql`
  # must specifiy what the directive will be applied to, e.g., TYPE, FIELD, etc.
  directive @log(message: String = "message") on FIELD_DEFINITION

  type User {
    id: ID! @log(message: "I'm the schema message")
    error: String! @deprecated(reason: "I'm deprecated")
    username: String!
    createdAt: String!
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
        createdAt: "123443",
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

  User: {
    error() {
      return "hey oh";
      // throw new Error("Dees nuts!!!");
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
  },
  formatError(e) {
    return [{ message: e.message, path: e.path, locations: e.locations, extensions: e.extensions }];
  },
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
