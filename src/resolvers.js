const { authenticated, authorized } = require("./auth");

// Set up pub-sub on server
const { PubSub, AuthenticationError } = require("apollo-server");
const pubSub = new PubSub({});

// events that we want to subscribe to
const NEW_POST = "NEW_POST";
const OTHER_POST = "OTHER_POST";

/**
 * Anything Query / Mutation resolver
 * using a user for a DB query
 * requires user authenication
 */
module.exports = {
  Query: {
    me(_, __, { user }) {
      return user;
    },
    posts(_, __, { user, models }) {
      return models.Post.findMany({ author: user.id });
    },

    post(_, { id }, { user, models }) {
      return models.Post.findOne({ id, author: user.id });
    },

    userSettings(_, __, { user, models }) {
      return models.Settings.findOne({ user: user.id });
    },
    // public resolver
    feed(_, __, { models }) {
      return models.Post.findMany();
    },
  },
  Mutation: {
    updateSettings(_, { input }, { user, models }) {
      return models.Settings.updateOne({ user: user.id }, input);
    },

    createPost(_, { input }, { user, models }) {
      const post = models.Post.createOne({ ...input, author: user.id });
      // Publish NEW_POST event on a createPost mutation
      pubSub.publish(NEW_POST, { newPost: post });
      return post;
    },
    createOtherPost(_, { input }, { user, models }) {
      const post = models.Post.createOne({ ...input, author: user.id });
      // Publish OTHER_POST event on a createOtherPost mutation
      pubSub.publish(OTHER_POST, { otherPost: post });
      return post;
    },

    updateMe(_, { input }, { user, models }) {
      return models.User.updateOne({ id: user.id }, input);
    },
    // admin role
    invite(_, { input }, { user }) {
      return { from: user.id, role: input.role, createdAt: Date.now(), email: input.email };
    },
    signup(_, { input }, { models, createToken }) {
      const existing = models.User.findOne({ email: input.email });

      if (existing) {
        throw new AuthenticationError("Invalid user");
      }
      const user = models.User.createOne({ ...input, verified: false, avatar: "http" });
      const token = createToken(user);
      return { token, user };
    },
    signin(_, { input }, { models, createToken }) {
      const user = models.User.findOne(input);

      if (!user) {
        throw new AuthenticationError("Invalid email + password combination");
      }

      const token = createToken(user);
      return { token, user };
    },
  },
  Subscription: {
    // Subscribe to NEW_POST events
    newPost: {
      subscribe: () => pubSub.asyncIterator(NEW_POST),
    },
    // Subscribe to OTHER_POST events
    otherPost: {
      subscribe: () => pubSub.asyncIterator(OTHER_POST),
    },
  },
  User: {
    posts(root, _, { user, models }) {
      if (root.id !== user.id) {
        throw new AuthenticationError("not yours");
      }

      return models.Post.findMany({ author: root.id });
    },
    settings(root, __, { user, models }) {
      return models.Settings.findOne({ id: root.settings, user: user.id });
    },
  },
  Settings: {
    user(settings, _, { user, models }) {
      return models.Settings.findOne({ id: settings.id, user: user.id });
    },
  },
  Post: {
    author(post, _, { models }) {
      return models.User.findOne({ id: post.author });
    },
  },
};

// Without directives
// module.exports = {
//   Query: {
//     me: authenticated((_, __, { user }) => {
//       return user;
//     }),
//     posts: authenticated((_, __, { user, models }) => {
//       return models.Post.findMany({ author: user.id });
//     }),

//     post: authenticated((_, { id }, { user, models }) => {
//       return models.Post.findOne({ id, author: user.id });
//     }),

//     userSettings: authenticated((_, __, { user, models }) => {
//       return models.Settings.findOne({ user: user.id });
//     }),
//     // public resolver
//     feed(_, __, { models }) {
//       return models.Post.findMany();
//     },
//   },
//   Mutation: {
//     updateSettings: authenticated((_, { input }, { user, models }) => {
//       return models.Settings.updateOne({ user: user.id }, input);
//     }),

//     createPost: authenticated((_, { input }, { user, models }) => {
//       const post = models.Post.createOne({ ...input, author: user.id });
//       // Publish NEW_POST event on a createPost mutation
//       pubSub.publish(NEW_POST, { newPost: post });
//       return post;
//     }),
//     createOtherPost: authenticated((_, { input }, { user, models }) => {
//       const post = models.Post.createOne({ ...input, author: user.id });
//       // Publish OTHER_POST event on a createOtherPost mutation
//       pubSub.publish(OTHER_POST, { otherPost: post });
//       return post;
//     }),

//     updateMe: authenticated((_, { input }, { user, models }) => {
//       return models.User.updateOne({ id: user.id }, input);
//     }),
//     // admin role
//     invite: authenticated(
//       authorized("ADMIN", (_, { input }, { user }) => {
//         return { from: user.id, role: input.role, createdAt: Date.now(), email: input.email };
//       })
//     ),

//     signup(_, { input }, { models, createToken }) {
//       const existing = models.User.findOne({ email: input.email });

//       if (existing) {
//         throw new AuthenticationError("Invalid user");
//       }
//       const user = models.User.createOne({ ...input, verified: false, avatar: "http" });
//       const token = createToken(user);
//       return { token, user };
//     },
//     signin(_, { input }, { models, createToken }) {
//       const user = models.User.findOne(input);

//       if (!user) {
//         throw new AuthenticationError("Invalid email + password combination");
//       }

//       const token = createToken(user);
//       return { token, user };
//     },
//   },
//   Subscription: {
//     // Subscribe to NEW_POST events
//     newPost: {
//       subscribe: () => pubSub.asyncIterator(NEW_POST),
//     },
//     // Subscribe to OTHER_POST events
//     otherPost: {
//       subscribe: () => pubSub.asyncIterator(OTHER_POST),
//     },
//   },
//   User: {
//     posts(root, _, { user, models }) {
//       if (root.id !== user.id) {
//         throw new AuthenticationError("not yours");
//       }

//       return models.Post.findMany({ author: root.id });
//     },
//     settings: authenticated((root, __, { user, models }) => {
//       return models.Settings.findOne({ id: root.settings, user: user.id });
//     }),
//   },
//   Settings: {
//     user(settings, _, { user, models }) {
//       return models.Settings.findOne({ id: settings.id, user: user.id });
//     },
//   },
//   Post: {
//     author(post, _, { models }) {
//       return models.User.findOne({ id: post.author });
//     },
//   },
// };
