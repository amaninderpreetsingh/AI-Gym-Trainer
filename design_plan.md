# Project Design Document: AI Personal Trainer Web App

**Project Goal:** Build a "hands-free" Personal Trainer web application. The user creates workout routines and performs them live. During a live session, the app uses Text-to-Speech to guide the user and Speech-to-Text to listen for logged weights and reps.

**Repository:** GitHub
**hosting:** Firebase Hosting

## 1. Technical Stack

* **Frontend Framework:** React (Vite) + TypeScript
* **Styling & UI:**
    * Tailwind CSS (Styling)
    * Shadcn/UI (Component Structure)
    * Framer Motion (Animations & Movement)
    * Lucide React (Icons)
* **Backend & Database:** Firebase v9
    * Authentication (Google Auth)
    * Firestore (Database)
    * Hosting
* **Voice Architecture:**
    * **Input (STT):** Browser native `SpeechRecognition` API.
    * **Output (TTS):** Browser native `SpeechSynthesis` API.
    * **Trigger:** User clicks "Start Session" -> App listens continuously -> User says "Hey Trainer [X] pounds [Y] reps".

---

## 2. Data Structure (Firestore)

**Collection: `users`**
* `uid`: string
* `email`: string

**Sub-Collection: `users/{uid}/routines`**
* `id`: string
* `name`: string (e.g., "Leg Day")
* `exercises`: Array<Object>
    * `name`: string (e.g., "Squat")
    * `targetSets`: number
    * `targetReps`: number
    * `muscleGroup`: string

**Sub-Collection: `users/{uid}/workout_logs`**
* `id`: string
* `routineId`: string
* `routineName`: string
* `startTime`: Timestamp
* `endTime`: Timestamp
* `exercisesCompleted`: Array<Object>
    * `name`: string
    * `sets`: Array<Object>
        * `weight`: number
        * `reps`: number
        * `timestamp`: Timestamp

---

## 3. AI Agent Roles
*When generating code, please adopt the following personas based on the phase:*

* **🤖 The Architect:** Focuses on directory structure, file naming, routing, Firebase configuration, and type definitions. Logic is strict and scalable.
* **🎨 The Designer:** Focuses on Tailwind classes, Framer Motion implementations, color schemes, and ensuring the UI is modern and fluid.
* **🧠 The Logic Engineer:** Focuses on complex state management (React Context), the Web Speech API hooks, and Regex parsing for voice commands.

---

## 4. Implementation Plan & Checkpoints

### Phase 1: Foundation & Authentication
* **Role:** The Architect
* **Tasks:**
    1.  Initialize React + Vite + TS.
    2.  Install Tailwind, Framer Motion, `react-router-dom`.
    3.  Configure Firebase (`firebase.ts`) and create the `AuthProvider`.
    4.  Create a Public Login Page (Google Button) and a Protected Dashboard Route.
* **🛑 MANUAL CHECKPOINT 1:** User can run the app locally, log in via Google, and be redirected to a blank Dashboard.

### Phase 2: Routine Management (CRUD)
* **Role:** The Logic Engineer & The Designer
* **Tasks:**
    1.  Create `CreateRoutine` page (Form to add exercises dynamically).
    2.  Create `Dashboard` page (Grid view of saved routines).
    3.  Implement Firestore `addDoc` and `getDocs` logic.
* **🛑 MANUAL CHECKPOINT 2:** User can create a "Back Day" routine with 3 exercises, save it, and see it appear on the Dashboard.

### Phase 3: The Workout Session UI (Visuals Only)
* **Role:** The Designer
* **Tasks:**
    1.  Create `ActiveSession` page.
    2.  Design "Current Exercise" card (Large text).
    3.  Design "Next Up" preview.
    4.  Add "Start Session" button (to initialize microphone permissions later).
    5.  Add visual feedback for "Listening" state (e.g., a pulsing microphone icon).
* **🛑 MANUAL CHECKPOINT 3:** User can open a routine and click through the UI cards. The animations are smooth. No voice logic yet.

### Phase 4: The Voice Brain (Logic)
* **Role:** The Logic Engineer
* **Tasks:**
    1.  Create `useTextToSpeech` hook (announce exercise name/sets).
    2.  Create `useSpeechRecognition` hook (continuous listening).
    3.  **Logic:** Detect phrase "Hey Trainer". Parse subsequent text (e.g., "50 pounds 10 reps") into numbers.
    4.  Save the parsed data to the local session state.
* **🛑 MANUAL CHECKPOINT 4:** User can start a session, hear the AI speak, say "Hey Trainer, 20 pounds 10 reps", and see the numbers appear on screen automatically.

### Phase 5: History & Polish
* **Role:** The Architect & Designer
* **Tasks:**
    1.  Save the completed session to Firestore `workout_logs`.
    2.  Create `History` page to view past logs.
    3.  Deploy to Firebase Hosting.
* **🛑 MANUAL CHECKPOINT 5:** User can complete a full workout using voice, then see it in their history log.