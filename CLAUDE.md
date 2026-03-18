# UniMeet — Claude Context

## Project

UniMeet is a React Native (Expo) mobile app with a Supabase backend.

The platform is a social and dating application designed for people with disabilities.

Main features:
- social feed (posts + comments + likes)
- swipe-style user matching
- private one-on-one chat
- notifications
- saved posts
- parent tips
- admin report system

Goal: prepare the application for stable production with ~5k active users.

---

# Tech Stack

Frontend
- React Native (Expo)
- Expo Router

Backend
- Supabase
  - Postgres database
  - Auth
  - Storage
  - Realtime

Other
- OpenAI GPT-4 mini
- AsyncStorage
- expo-image-picker
- expo-av

---

# Database Tables

Public schema tables:

users
conditions

posts
comments
postLikes
saved_posts
saved_tips

interactions
matches
match_notifications

chats
messages

notifications
reports

---

# Database Relations

Users
- users.id is the primary user identifier

Feed
- posts.userId → users.id
- comments.userId → users.id
- comments.postId → posts.id
- postLikes.userId → users.id
- postLikes.postId → posts.id
- saved_posts.userid → users.id
- saved_posts.postid → posts.id

Matching
- interactions.user_id → users.id
- interactions.target_id → users.id
- matches.user1 → users.id
- matches.user2 → users.id

Chat
- chats.user1_id → users.id
- chats.user2_id → users.id
- messages.chat_id → chats.id
- messages.sender_id → users.id

Notifications
- notifications.senderId → users.id
- notifications.receiverId → users.id

Reports
- reports.reporter_id → users.id
- reports.post_id → posts.id

Saved Tips
- saved_tips.user_id → users.id

Conditions
- conditions is metadata describing user conditions/disabilities

---

# Architecture Rules

1. Screen components must not contain business logic.
2. All database access must go through `services/`.
3. UI components must never query Supabase directly.
4. Database writes must respect Supabase RLS policies.
5. Supabase credentials must come from environment variables only.
6. Upload logic must remain centralized in `imageService` or `audioService`.

---

# Security Rules

- Never expose `service_role` keys.
- All writes must be protected by RLS.
- Policies should target `authenticated`, not `public`.
- Never rely only on client-side validation.

---

# Known Constraints

Current limitations that may affect scalability:

- chat currently polls messages every few seconds
- matching logic filters users in JavaScript
- some service files are large and should eventually be split

These are known limitations but not immediate blockers.

---

# Development Priorities

When analyzing or modifying the codebase, prioritize:

1. security
2. correctness
3. reliability
4. scalability
5. code quality

---

# Working Style

Before implementing changes:

1. analyze the problem
2. explain the root cause
3. propose the fix
4. apply minimal safe changes
5. explain what should be manually tested after the change

# Instruction

Always read this file before modifying the project.