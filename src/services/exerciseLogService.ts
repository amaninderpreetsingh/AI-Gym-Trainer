import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExerciseLog, CompletedExercise, LoggedSet } from '../types';

// Get the exercise logs collection reference for a user
const getExerciseLogsRef = (userId: string) =>
    collection(db, 'users', userId, 'exercise_logs');

// Save exercise logs when a workout is completed (called from workoutLogService)
export const saveExerciseLogs = async (
    userId: string,
    workoutLogId: string,
    routineName: string,
    date: Date,
    exercisesCompleted: CompletedExercise[],
    exerciseMuscleGroupMap: Record<string, string>
): Promise<void> => {
    const logsRef = getExerciseLogsRef(userId);
    const batch = writeBatch(db);

    exercisesCompleted.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight), 0);
        const newDocRef = doc(logsRef);

        batch.set(newDocRef, {
            exerciseName: exercise.name,
            muscleGroup: exerciseMuscleGroupMap[exercise.name] || 'Other',
            workoutLogId,
            routineName,
            date: Timestamp.fromDate(date),
            sets: exercise.sets.map(set => ({
                weight: set.weight,
                reps: set.reps,
                timestamp: Timestamp.fromDate(set.timestamp)
            })),
            maxWeight
        });
    });

    await batch.commit();
};

// Get all exercise logs for a specific exercise (for Progress page)
export const getExerciseLogs = async (
    userId: string,
    exerciseName: string
): Promise<ExerciseLog[]> => {
    const logsRef = getExerciseLogsRef(userId);
    const q = query(
        logsRef,
        where('exerciseName', '==', exerciseName),
        orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            exerciseName: data.exerciseName,
            muscleGroup: data.muscleGroup,
            workoutLogId: data.workoutLogId,
            routineName: data.routineName,
            date: data.date.toDate(),
            sets: data.sets.map((set: { weight: number; reps: number; timestamp: Timestamp }) => ({
                weight: set.weight,
                reps: set.reps,
                timestamp: set.timestamp.toDate()
            })),
            maxWeight: data.maxWeight
        };
    });
};

// Get the last log for a specific exercise
export const getLastExerciseLog = async (
    userId: string,
    exerciseName: string
): Promise<ExerciseLog | null> => {
    const logsRef = getExerciseLogsRef(userId);
    // Fetch all logs for this exercise without sorting in Firestore to avoid index requirement
    const q = query(
        logsRef,
        where('exerciseName', '==', exerciseName)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Sort in memory by date (ascending)
    const docs = snapshot.docs.sort((a, b) => {
        const dateA = a.data().date.toMillis();
        const dateB = b.data().date.toMillis();
        return dateA - dateB;
    });

    // Get the last document (most recent)
    const doc = docs[docs.length - 1];
    const data = doc.data();

    return {
        id: doc.id,
        exerciseName: data.exerciseName,
        muscleGroup: data.muscleGroup,
        workoutLogId: data.workoutLogId,
        routineName: data.routineName,
        date: data.date.toDate(),
        sets: data.sets.map((set: { weight: number; reps: number; timestamp: Timestamp }) => ({
            weight: set.weight,
            reps: set.reps,
            timestamp: set.timestamp.toDate()
        })),
        maxWeight: data.maxWeight
    };
};

// Get all exercise logs filtered by muscle group
export const getExerciseLogsByMuscleGroup = async (
    userId: string,
    muscleGroup: string
): Promise<ExerciseLog[]> => {
    const logsRef = getExerciseLogsRef(userId);
    const q = query(
        logsRef,
        where('muscleGroup', '==', muscleGroup),
        orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            exerciseName: data.exerciseName,
            muscleGroup: data.muscleGroup,
            workoutLogId: data.workoutLogId,
            routineName: data.routineName,
            date: data.date.toDate(),
            sets: data.sets.map((set: { weight: number; reps: number; timestamp: Timestamp }) => ({
                weight: set.weight,
                reps: set.reps,
                timestamp: set.timestamp.toDate()
            })),
            maxWeight: data.maxWeight
        };
    });
};

// Get unique exercise names the user has logged
export const getUniqueExerciseNames = async (userId: string): Promise<string[]> => {
    const logsRef = getExerciseLogsRef(userId);
    const snapshot = await getDocs(logsRef);

    const names = new Set<string>();
    snapshot.docs.forEach(doc => {
        names.add(doc.data().exerciseName);
    });

    return Array.from(names).sort();
};

// Get unique exercise names with their muscle groups
export const getExerciseNamesWithMuscleGroups = async (
    userId: string
): Promise<Array<{ name: string; muscleGroup: string }>> => {
    const logsRef = getExerciseLogsRef(userId);
    const snapshot = await getDocs(logsRef);

    const exerciseMap = new Map<string, string>();
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!exerciseMap.has(data.exerciseName)) {
            exerciseMap.set(data.exerciseName, data.muscleGroup);
        }
    });

    return Array.from(exerciseMap.entries())
        .map(([name, muscleGroup]) => ({ name, muscleGroup }))
        .sort((a, b) => a.name.localeCompare(b.name));
};

// Update an exercise log (for editing sets)
export const updateExerciseLog = async (
    userId: string,
    exerciseLogId: string,
    sets: LoggedSet[]
): Promise<void> => {
    const logRef = doc(db, 'users', userId, 'exercise_logs', exerciseLogId);
    const maxWeight = Math.max(...sets.map(s => s.weight), 0);

    await updateDoc(logRef, {
        sets: sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
            timestamp: Timestamp.fromDate(set.timestamp)
        })),
        maxWeight
    });
};

// Delete all exercise logs for a workout
export const deleteExerciseLogsByWorkout = async (
    userId: string,
    workoutLogId: string
): Promise<void> => {
    const logsRef = getExerciseLogsRef(userId);
    const q = query(logsRef, where('workoutLogId', '==', workoutLogId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

// Delete a single exercise log
export const deleteExerciseLog = async (
    userId: string,
    exerciseLogId: string
): Promise<void> => {
    const logRef = doc(db, 'users', userId, 'exercise_logs', exerciseLogId);
    await deleteDoc(logRef);
};

// Sync exercise logs when a workout log is updated
export const updateExerciseLogsForWorkout = async (
    userId: string,
    workoutLogId: string,
    routineName: string,
    date: Date,
    exercisesCompleted: CompletedExercise[],
    exerciseMuscleGroupMap: Record<string, string> = {}
): Promise<void> => {
    const logsRef = getExerciseLogsRef(userId);
    const q = query(logsRef, where('workoutLogId', '==', workoutLogId));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    const existingLogsMap = new Map<string, ExerciseLog>();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        existingLogsMap.set(data.exerciseName, { id: doc.id, ...data } as ExerciseLog);
    });

    // Proccess updated exercises
    exercisesCompleted.forEach(exercise => {
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight), 0);
        const existingLog = existingLogsMap.get(exercise.name);

        const logData = {
            exerciseName: exercise.name,
            workoutLogId,
            routineName,
            date: Timestamp.fromDate(date),
            sets: exercise.sets.map(set => ({
                weight: set.weight,
                reps: set.reps,
                timestamp: Timestamp.fromDate(set.timestamp)
            })),
            maxWeight,
            // Only update muscle group if provided, otherwise keep existing or default to 'Other'
            muscleGroup: exerciseMuscleGroupMap[exercise.name] || existingLog?.muscleGroup || 'Other'
        };

        if (existingLog) {
            // Update existing log
            const logRef = doc(db, 'users', userId, 'exercise_logs', existingLog.id);
            batch.update(logRef, logData);
            existingLogsMap.delete(exercise.name); // Mark as processed
        } else {
            // Create new log (e.g. added exercise during edit)
            const newDocRef = doc(logsRef);
            batch.set(newDocRef, logData);
        }
    });

    // Delete logs for exercises that were removed
    existingLogsMap.forEach((log) => {
        const logRef = doc(db, 'users', userId, 'exercise_logs', log.id);
        batch.delete(logRef);
    });

    await batch.commit();
};
