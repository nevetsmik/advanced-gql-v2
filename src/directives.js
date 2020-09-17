const { SchemaDirectiveVisitor, AuthenticationError } = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const { formatDate } = require("./utils");

class FormatDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.args.push({ type: GraphQLString, name: "dateFormat" });

    const oldResolver = field.resolve || defaultFieldResolver;
    field.resolve = async (root, { dateFormat, ...rest }, ctx, info) => {
      const result = await oldResolver.call(this, root, rest, ctx, info);
      const format = dateFormat || this.args.dateFormat;
      return formatDate(result, format);
    };
  }
}

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.resolve = (root, args, ctx, info) => {
      if (!ctx.user) {
        throw new AuthenticationError("not authenticated");
      }
      return resolver.call(this, root, args, ctx, info);
    };
  }
}

class AuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { role } = this.args; // this is coming from the default value in the schema
    field.resolve = (root, args, ctx, info) => {
      if (ctx.user.role !== role) {
        throw new AuthenticationError(`Must be a ${role}, bruh`);
      }
      return resolver.call(this, root, args, ctx, info);
    };
  }
}

module.exports = {
  FormatDateDirective,
  AuthenticationDirective,
  AuthorizationDirective,
};
