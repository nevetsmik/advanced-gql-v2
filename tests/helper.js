const { ApolloServer } = require("apollo-server");
const { createTestClient } = require("apollo-server-testing");
const typeDefs = require("../src/typedefs");
const resolvers = require("../src/resolvers");

const createTestServer = (ctx) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // Provide mocks when I don't provide them
    mockEntireSchema: false,
    // Allow apollo-server to create mocks based on my typeDefs
    mocks: true,
    context: () => ctx,
  });

  return createTestClient(server);
};

module.exports = createTestServer;
