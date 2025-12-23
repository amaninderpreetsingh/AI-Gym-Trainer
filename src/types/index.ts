// User type from Firebase Auth
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

// Exercise within a routine
export interface Exercise {
    name: string;
    targetSets: number;
    targetReps: number;
    muscleGroup: string;
}

// Workout routine
export interface Routine {
    id: string;
    name: string;
    exercises: Exercise[];
    createdAt: Date;
}

// Individual set logged during workout
export interface LoggedSet {
    weight: number;
    reps: number;
    timestamp: Date;
}

// Exercise completed during a workout session
export interface CompletedExercise {
    name: string;
    sets: LoggedSet[];
}

// Complete workout log
export interface WorkoutLog {
    id: string;
    routineId: string;
    routineName: string;
    startTime: Date;
    endTime: Date;
    exercisesCompleted: CompletedExercise[];
}

// Session state for active workout
export interface SessionState {
    routine: Routine;
    currentExerciseIndex: number;
    currentSetIndex: number;
    completedExercises: CompletedExercise[];
    isListening: boolean;
    startTime: Date;
}
