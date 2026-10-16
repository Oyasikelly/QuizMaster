# Quiz flow regression checklist

Manual script for the one thing that can never break while the scale-up
work is in progress: a student taking a quiz. Run this after **every**
phase of the roadmap (schema change, RLS policy, route change — anything),
against staging first and production after deploy. Each phase should add
to this list if it touches new behavior, not replace it.

Takes about 10 minutes run by hand. (Phase 7 task t33 turns the scoring
half of this into an automated test; this checklist stays useful for the
parts a unit test can't cover — auth, navigation, timers, DB writes.)

## Setup
- [ ] Have one real student account and one real admin account (or create
      throwaway ones) in the environment under test.

## 1. Auth & profile
- [ ] Sign up a brand-new student account → redirected to `/setup-profile`.
- [ ] Submit the student form with `name`, `classname`, `denomination` →
      redirected to `/student/home`.
- [ ] Sign up a brand-new admin account → `/setup-profile` shows the admin
      fields (phone, position, department, access level) instead.
- [ ] Submit the admin form → redirected to `/admin/dashboard`.
- [ ] Sign out, sign back in as the student → lands on `/student/home`
      without being asked to set up a profile again.
- [ ] Visit `/admin/dashboard` while signed in as the student → redirected
      away (middleware check still holds).

## 2. Quiz settings (admin)
- [ ] As admin, open quiz settings and confirm current `is_active`,
      `practice_mode`, `time`, `questions`, start/end time load correctly.
- [ ] Toggle `practice_mode` on, save, reload the page → value persisted.
- [ ] Toggle it back to its original value when done, so you don't leave
      the environment in a different state than you found it.

## 3. Practice mode (student)
- [ ] With practice mode enabled and the real-quiz window **not** active,
      open `/quiz/adults` (repeat for `/quiz/yaya`, `/quiz/teenagers`) →
      shows "Practice Mode", lets you pick Academic Year → Lesson →
      Difficulty.
- [ ] Changing Year/Difficulty updates the available lessons list.
- [ ] The "X questions available in this lesson" count updates when you
      change lesson/difficulty.
- [ ] Press "Start Practice Quiz" → lands on the quiz with the selected
      lesson/difficulty's questions, correct question count, correct timer.
- [ ] Answer every question (mix of multiple-choice and fill-in-the-blank
      lessons if the lesson has both), hit Submit.
- [ ] Redirected to `/quiz/results` with the correct `correct`/`total`
      counts shown.
- [ ] A new row appears in `quiz_results` with the right
      `practice_<difficulty>_score` / `_total` columns populated and the
      other difficulty columns left null.
- [ ] "Practice Entire Year" button also starts a quiz successfully.

## 4. Real quiz window (student)
- [ ] With the real-quiz window active (`is_active = true`, current time
      between `start_time`/`end_time`), `/quiz/adults` shows "Real Quiz
      Mode" with time/questions **locked** to the admin-configured values.
- [ ] Take and submit the real quiz → redirected to results with the right
      score.
- [ ] A `quiz_results` row is written with `real_score`/`real_total` set
      and `lesson` null.
- [ ] Reload `/quiz/adults` as the same student → "already taken" message
      shown, Start button disabled.
- [ ] A second student account, same window → can still take the real
      quiz once.

## 5. Timer & submission edge cases
- [ ] Let the timer hit 0 without pressing Submit → auto-submits and still
      reaches the results page with a real score.
- [ ] Try closing/refreshing the tab mid-quiz → browser shows the
      "are you sure" warning.
- [ ] Temporarily break network (e.g. devtools offline) right before
      Submit → error overlay shows with a working Retry button; retry
      after restoring network succeeds.

## 6. Admin visibility
- [ ] The student/result records from steps 3–4 show up correctly in
      `StudentManagement.jsx` / `QuizAnalytics.jsx` / the admin student
      detail page for that student.

---
Anything that fails here blocks merging whatever roadmap change you were
testing — fix it before moving to the next phase, don't carry it forward.
