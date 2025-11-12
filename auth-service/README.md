## Additions to FR and NFR
`FR`
1. PeerPrep should allow users to create their profile
1.1 PeerPrep profile schema should include userId, handle, currentRating, problemsSolved, contestHistory, createdAt and updatedAt
1.2 PeerPrep auth data should be separated from their auth data by creating another collection 

### Endpoint Design
1. GET /api/v1/users  -> List all users
2. GET /api/v1/users/:id -> Get a specific user's id information
`Note: for Auth, its already manage by BetterAuth`
3. GET /api/v1/users/:id/profile -> Get a user's specific profile details
4. POST /api/v1/users/:id/profile -> Create a user's specific profile details
5. PUT /api/v1/users/:id/profile -> Update a user's specific profile details





### Models Design

**Description**: MongoDB is a document-based schema and is scalable because of how it structures and stores data. It is a non-relational database, which means relationship between different dataset in this case collections, are not captured as rigidly as in a relational database. The idea is instead catering the database to application needs and how it is queried. Think Facebook, it makes sense to store user data in a document based database because you could retrieve all data pertaining to a user in one query. However, this also means that if you want to query data across multiple collections, it could be very well be more expensive than a relational database since you might have to do brute-force search for other collections to find matching key values. This is a tradeoff that one has to recognise when using MongoDB. It is scalable on the basis of limiting queries to a single collection, but not so much when you have to query across multiple collections.

**Problem**: We chose to run with BetterAuth for authentication. This is because it comes with a bunch of handy features, and deals with the security aspect of things. For example, OAuth, which might be hard to implement yourself. However, its schema is already created for `users` using a MongoDB adapter. We can configure by adding fields, however there is the problem of coupling. Should we mix authentication data with PeerPrep user profile data? 

1. Authentication is a separate concern, it concerns verifying user's identity as well as their permissions. 
2. PeerPrep user profile data deals with non-authenticaation data. 

By keeping them separate, we can manage their lifecycle independently. For example, if we want to add a new field to PeerPrep user profile, we can do so without affecting the authentication schema.

**Solution**: We decided to create a separate collection for PeerPrep user profile data. We use `userId` to link authentication data with PeerPrep user profile data. This preserves the source of truth for userId to be the authenticator. However, we also use the fact that with sessions, we can store the userId in the session object. This means that when a user is authenticated, we can retrieve their userId from the session object and use it to query the PeerPrep user profile collection. This way, we can keep the two collections separate, we still are able to achieve comparable performance

### Profile
- Set up profile with m1-auth. I felt that it was reasonable to justify since authentication and user  has overlapping domain. So by making it into 1 service, we can allow easy retrieval of profile (Without api backend call to another service)