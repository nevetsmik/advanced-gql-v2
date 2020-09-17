const gql = require("graphql-tag");

module.exports = gql`
  directive @formatDate(dateFormat: String = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") on FIELD_DEFINITION
  directive @authenticated on FIELD_DEFINITION
  directive @authorized(role: Role!) on FIELD_DEFINITION

  enum Theme {
    DARK
    LIGHT
  }

  enum Role {
    ADMIN
    MEMBER
    GUEST
  }

  type User {
    id: ID!
    email: String!
    avatar: String!
    verified: Boolean!
    createdAt: String! @formatDate
    posts: [Post]!
    role: Role!
    settings: Settings!
  }

  type AuthUser {
    token: String!
    user: User!
  }

  type Post {
    id: ID!
    message: String!
    author: User!
    createdAt: String!
    likes: Int!
    views: Int!
  }

  type Settings {
    id: ID!
    user: User!
    theme: Theme!
    emailNotifications: Boolean!
    pushNotifications: Boolean!
  }

  type Invite {
    email: String!
    from: User!
    createdAt: String!
    role: Role!
  }

  # Input for creating a post
  input PostInput {
    message: String!
  }

  input UpdateSettingsInput {
    theme: Theme
    emailNotifications: Boolean
    pushNotifications: Boolean
  }

  input UpdateUserInput {
    email: String
    avatar: String
    verified: Boolean
  }

  input InviteInput {
    email: String!
    role: Role!
  }

  input SignupInput {
    email: String!
    password: String!
    role: Role!
  }

  input SigninInput {
    email: String!
    password: String!
  }

  type Query {
    me: User! @authenticated
    posts: [Post]! @authenticated
    post(id: ID!): Post! @authenticated
    userSettings: Settings! @authenticated
    feed: [Post]!
  }

  type Mutation {
    updateSettings(input: UpdateSettingsInput!): Settings! @authenticated
    # createPost is going to listen for the NEW_POST event
    createPost(input: PostInput!): Post! @authenticated
    # createOtherPost is going to listen for the OTHER_POST event
    createOtherPost(input: PostInput!): Post! @authenticated
    updateMe(input: UpdateUserInput!): User @authenticated
    invite(input: InviteInput!): Invite! @authenticated @authorized(role: ADMIN)
    signup(input: SignupInput!): AuthUser!
    signin(input: SigninInput!): AuthUser!
  }

  type Subscription {
    # Subscription to posts with payload of newPost
    newPost: Post @authenticated
    # Subscription to posts with payload of otherPost
    otherPost: Post @authenticated
  }
`;
