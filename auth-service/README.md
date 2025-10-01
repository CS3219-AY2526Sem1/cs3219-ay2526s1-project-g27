## Additions to FR and NFR
`FR`
1. PeerPrep should allow users to create their profile
1.1 PeerPrep profile schema should include userId, handle, currentRating, rank, problemsSolved, contestHistory, createdAt and updatedAt
1.2 PeerPrep auth data should be separated from their auth data by creating another collection 

### Endpoint Design
1. GET /api/v1/users  -> List all users
2. GET /api/v1/users/:id -> Get a specific user's id information
3. GET /api/v1/users/:id/profile -> Get a user's specific profile details

### Models Design
