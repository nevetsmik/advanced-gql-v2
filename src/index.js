const { ApolloServer, AuthenticationError } = require("apollo-server");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { createToken, getUserFromToken } = require("./auth");
const db = require("./db");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({ req, connection }) {
    const context = { ...db };
    // Handle context differenctly for subscriptions, which will have a connection obj
    if (connection) {
      return { ...context, ...connection.context };
    }
    // Express will always lowercase authorization prop on headers, i.e., express will normalize 'Authorization' to 'authorization'
    const token = req.headers.authorization;
    const user = getUserFromToken(token);
    return { ...context, user, createToken };
  },
  // Authentication is handled differently for subscriptions
  subscriptions: {
    // onConnect is a handler which is used every time a subscription connection is made
    // Must return a truthy value for connection to work
    onConnect(params) {
      // name of 'authToken' is defined by what gets sent from frontend when requesting a subscription
      const token = params.authToken;
      const user = getUserFromToken(token);
      if (!user) {
        throw new AuthenticationError("Not authenticated for subscription");
      }
      // Whatever is returned here gets merged with the connection.context object in the context method
      return { user };
    },
  },
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
