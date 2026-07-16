# QuizMaster

QuizMaster is a dynamic, full-featured Bible quiz application designed to test and enhance users' knowledge of biblical principles, stories, and teachings. With a sleek and responsive user interface, it offers a seamless experience for students and powerful management tools for administrators.

## Features

- **User Authentication**: Secure sign-up and login functionality powered by Supabase.
- **Dynamic Quiz Categories**: Tailored quizzes for different classes such as Adults and YAYA (Young Adults and Youth Affairs).
- **Dual Quiz Modes**:
  - **Practice Mode**: Students can practice specific lessons or the entire year's curriculum with adjustable difficulties (Normal, Medium, Hard).
  - **Real Mode**: Timed, official quizzes for assessment.
- **Advanced Admin Dashboard**:
  - Comprehensive analytics and charts.
  - Student performance tracking and detailed history views.
  - CSV exports for all quiz results and student data.
  - Dynamic application configuration settings.
- **Optimized Data Architecture**: Uses a highly efficient, consolidated single-row database schema to track all student attempts (Real, Practice Normal, Medium, Hard, and Entire Year) without cluttering the database.
- **Responsive Design & UX**: Optimized for all devices with skeleton loading states and smooth Framer Motion animations.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/quizmaster.git
   ```

2. Navigate to the project directory:

   ```bash
   cd quizmaster
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env.local` file in the root directory and add your environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000` to explore QuizMaster.

## Technologies Used

- **Frontend**: React.js with Next.js (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons & Lucide React
- **Charts**: Recharts
- **Database & Auth**: Supabase
- **Deployment**: Vercel

## How to Use

1. **For Students**: Sign up, choose your class (Adult or YAYA), and start taking Practice or Real quizzes from your dashboard.
2. **For Admins**: Log in with an admin account to access the `/admin/dashboard`. From there, you can view analytics, manage students, export results, and adjust system settings.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgments

- [Supabase](https://supabase.com) for backend services.
- [Framer Motion](https://www.framer.com/motion/) for animations.
- [Tailwind CSS](https://tailwindcss.com) for styling.

## Contact

For inquiries or support, please contact:

**Oyasi Kelly**  
Email: oyasikelly28@gmail.com  
Portfolio: [oyasi-kelly.vercel.app](https://oyasi-kelly.vercel.app/)
