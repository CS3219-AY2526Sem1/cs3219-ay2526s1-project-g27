# Question service
Base URL: `http://localhost:3013/question`

---

## Question Endpoints

### Create a new question  
**POST** `/`  
**Body:**
```json
{
    "QuestionTitle": "N-Queen Problem",
    "QuestionDescription": "Return all distinct solutions to the n-queens puzzle",
    "QuestionComplexity": "easy",
    "QuestionCategories": ["Algorithms"],
}
```
**Response:**
```json
{
    "message": "Question created successfully",
    "createdQuestion": {
        "_id": "68f34ca9f5d7e97b5349d0ed",
        "QuestionTitle": "N-Queen Problem",
        "QuestionDescription": "Return all distinct solutions to the n-queens puzzle",
        "QuestionComplexity": "easy",
        "QuestionCategories": ["Algorithms"],
        "__v": 0
    }
}
```

### Get all questions
**GET** `/all`  
**Response:**
```json
{[
    {
        "_id": "68f34ca9f5d7e97b5349d0ed",
        "QuestionTitle": "N-Queen Problem",
        "QuestionDescription": "Return all distinct solutions to the n-queens puzzle.",
        "QuestionCategories": ["Algorithms"],
        "QuestionComplexity": "hard",
        "__v": 0
    },
    {
        "_id": "68f34cdcf5d7e97b5349d0f8",
        "QuestionTitle": "Two Sum",
        "QuestionDescription": "Find indices of the two numbers that add up to target.",
        "QuestionCategories": ["Data Structures"],
        "QuestionComplexity": "easy",
        "__v": 0
    }
]}
```

### Get question by ID
**GET** `/:id`  
**Response:**
```json
{
  "_id": "68f34cdcf5d7e97b5349d0f8",
  "QuestionTitle": "Two Sum",
  "QuestionDescription": "Find indices of the two numbers that add up to target.",
  "QuestionCategories": ["Data Structures"],
  "QuestionComplexity": "easy",
  "__v": 0
}
```

### Update question by ID
**PUT** `/:id`  
**Body:**
```json
{
  "QuestionCategories": ["Trees", "Algorithms"],
  "QuestionTitle": "N-Queens Problem"
}
```
**Response:**
```json
{
  "message": "Question updated successfully"
}
```

### Delete question by ID
**DELETE** `/:id` 

**Response:** 204 no content

## Question Attempt Endpoints

### Add a question attempt (for two users)
**POST** `/`  
**Body:**
```json
{
  "UserId1": "123",
  "UserId2": "456",
  "question": {
    "QuestionTitle": "N-Queen Problem",
    "QuestionCategories": ["Algorithms"],
    "QuestionComplexity": "hard"
  }
}
```
**Response:**
```json
{
  "message": "User attempts added successfully"
}
```

### Get all attempts for a specific user
**GET** `/:UserId`

**Response:**
```json
[
  {
    "_id": "68f34ca9f5d7e97b5349d0ed",
    "UserId": "123",
    "QuestionTitle": "N-Queen Problem",
    "Categories": ["Algorithms"],
    "Difficulty": "hard",
    "AttemptedAt": "2025-11-12T12:34:56.789Z",
    "__v": 0
  }
]
```

### Add a question attempt (for two users)
**POST** `/`  
**Body:**
```json
{
  "UserId1": "123",
  "UserId2": "456",
  "question": {
    "QuestionTitle": "N-Queen Problem",
    "QuestionCategories": ["Algorithms"],
    "QuestionComplexity": "hard"
  }
}
```
**Response:**
```json
{
  "message": "User attempts added successfully"
}
```

# Database schema
## Question :
```
  QuestionTitle: String,
  QuestionDescription: String,
  QuestionCategories: [String],
  QuestionComplexity: enum: ["easy", "medium", "hard"],
  ```


## QuestionAttempt :
```
  UserId: String,
  QuestionTitle: String,
  AttemptedAt: Date, default: Date.now,
  Categories: [String],
  Difficulty: enum: ["easy", "medium", "hard"],
```

## Run as part of PeerPrep
To run as part of PeerPrep, simply start PeerPrep using `docker compose up --build` at the root of the project, question service will automatically be launched and seeded.

## Technical choices
# Database : MongoDB
MongoDB was chosen because of its flexible schema (Document-Oriented) which makes it easy to evolve data model. This is ideal for agile and rapidly changing applications.
Furthermore, all data models in question service is simple, there is no need for complex relationships or joins.

# Integration with other services :
Question service integrates with other services by exposing CRUD endpoints for question and attempt history. REST API is used for these endpoints as it is standardized and easy for both frontend and backend developers to understand and implement, without needing custom protocols or tools. It also takes a lot of load off the server due to its stateless and caching nature.

## Edge case : No question found
On the GET /question/random endpoint, if the user selects a difficulty and topic combination that doesn't exist in the question database, they will be prompted to select another option when trying to join the matching queue
