# Bible Quiz App

Welcome to the **Bible Quiz App**, an interactive platform designed to test your knowledge of the Bible while providing a fun and engaging experience for all ages. This app encourages learning and spiritual growth through thoughtfully curated quizzes.

---

## Features

- **User Authentication**:

  - Secure sign-up and login functionality to save user progress.
  - Authentication ensures that only registered users can access the app.

- **Dynamic Quizzes**:

  - A variety of Bible-based quiz topics, including Old Testament, New Testament, Bible characters, and general principles.
  - Multiple-choice questions with real-time feedback on answers.

- **User Dashboard**:

  - Track your progress and see your quiz history.
  - Compare your scores with other users.

- **Interactive Animations**:

  - Smooth animations powered by Framer Motion for a delightful user experience.

- **Responsive Design**:
  - Fully responsive interface to ensure seamless use on all devices, from desktops to smartphones.

---

## Technologies Used

### Frontend

- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion

### Backend

- **Database**: Supabase for user authentication and data management
- **API**: Custom endpoints for user and quiz management

---

## Installation

To run the Bible Quiz App locally, follow these steps:

### Prerequisites

- Node.js (>=16.x)
- npm or yarn

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/bible-quiz-app.git
   ```

2. Navigate to the project directory:

   ```bash
   cd bible-quiz-app
   ```

3. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

4. Create a `.env` file in the root directory and add the following:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open your browser and navigate to `http://localhost:3000`.

---

## Usage

1. **Sign Up or Log In**:

   - Create an account or log in to access the quiz app.

2. **Choose a Quiz**:

   - Select from various categories to begin.

3. **Take the Quiz**:

   - Answer the questions, and your score will be displayed at the end.

4. **Track Progress**:
   - Visit your dashboard to view your quiz history and compare scores.

---

## Deployment

To deploy the app, follow these steps:

1. Build the production files:

   ```bash
   npm run build
   # or
   yarn build
   ```

2. Deploy the `dist` folder to your preferred hosting service (e.g., Netlify, Vercel).

---

## Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add a new feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- Thanks to [Supabase](https://supabase.io/) for the backend services.
- Inspired by the desire to promote Bible study and learning.

---

## Contact

For support or inquiries, please reach out to:

- **Email**: [oyasikelly28@gmail.com](mailto:oyasikelly28@gmail.com)
- **Portfolio**: [https://oyasi-kelly.vercel.app/](https://oyasi-kelly.vercel.app/)
