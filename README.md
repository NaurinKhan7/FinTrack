# FinTrack - Backend

This is the backend API for the FinTrack application. It provides endpoints for user management, transaction tracking, and budget monitoring.

## Features

- User authentication with JWT
- Transaction management (CRUD operations)
- Budget tracking and alerts
- MongoDB database integration
- Input validation and error handling
- Secure password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd finance-tracker-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   - Set `MONGODB_URI` to your MongoDB connection string
   - Set `JWT_SECRET` to a secure random string
   - Optionally modify `PORT` (defaults to 5000)

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- Body: `{ "email": "user@example.com", "password": "password123", "name": "John Doe" }`

#### Login User
- **POST** `/api/auth/login`
- Body: `{ "email": "user@example.com", "password": "password123" }`

#### Get User Profile
- **GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### Transaction Endpoints

#### Get All Transactions
- **GET** `/api/transactions`
- Headers: `Authorization: Bearer <token>`

#### Add Transaction
- **POST** `/api/transactions`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "type": "expense", "amount": 50, "category": "Food & Dining", "description": "Lunch" }`

#### Update Transaction
- **PUT** `/api/transactions/:id`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "amount": 45, "description": "Updated lunch" }`

#### Delete Transaction
- **DELETE** `/api/transactions/:id`
- Headers: `Authorization: Bearer <token>`

### Budget Endpoints

#### Get All Budgets
- **GET** `/api/budgets`
- Headers: `Authorization: Bearer <token>`

#### Create Budget
- **POST** `/api/budgets`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "category": "food", "amount": 500, "period": "monthly" }`

#### Update Budget
- **PUT** `/api/budgets/:id`
- Headers: `Authorization: Bearer <token>`
- Body: `{ "amount": 600 }`

#### Get Budget Status
- **GET** `/api/budgets/:id/status`
- Headers: `Authorization: Bearer <token>`

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

The API can be deployed to various platforms. Here are the steps for some common options:

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add all variables from `.env`

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation using express-validator
- MongoDB injection prevention
- CORS enabled for specified origins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
