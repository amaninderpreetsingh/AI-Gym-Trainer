import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkoutLog, CompletedExercise } from '../types';
import { saveExerciseLogs, deleteExerciseLogsByWorkout, updateExerciseLogsForWorkout } from './exerciseLogService';

// Get the workout logs collection reference for a user
const getWorkoutLogsRef = (userId: string) =>
    collection(db, 'users', userId, 'workout_logs');

// Save a completed workout session
export const saveWorkoutLog = async (
    userId: string,
    routineId: string,
    routineName: string,
    startTime: Date,
    endTime: Date,
    exercisesCompleted: CompletedExercise[],
    exerciseMuscleGroupMap: Record<string, string> = {}
): Promise<string> => {
    const logsRef = getWorkoutLogsRef(userId);

    // Convert dates to Timestamps for Firestore
    const docRef = await addDoc(logsRef, {
        routineId,
        routineName,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        exercisesCompleted: exercisesCompleted.map(ex => ({
            name: ex.name,
            sets: ex.sets.map(set => ({
                weight: set.weight,
                reps: set.reps,
                timestamp: Timestamp.fromDate(set.timestamp)
            }))
        })),
        duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000) // seconds
    });

    // Also save denormalized exercise logs for efficient querying
    await saveExerciseLogs(
        userId,
        docRef.id,
        routineName,
        startTime,
        exercisesCompleted,
        exerciseMuscleGroupMap
    );

    return docRef.id;
};

// Update a workout log
// Update a workout log
export const updateWorkoutLog = async (
    userId: string,
    workoutLogId: string,
    exercisesCompleted: CompletedExercise[],
    routineName: string,
    startTime: Date
): Promise<void> => {
    const logRef = doc(db, 'users', userId, 'workout_logs', workoutLogId);

    await updateDoc(logRef, {
        exercisesCompleted: exercisesCompleted.map(ex => ({
            name: ex.name,
            sets: ex.sets.map(set => ({
                weight: set.weight,
                reps: set.reps,
                timestamp: Timestamp.fromDate(set.timestamp)
            }))
        }))
    });

    // Sync exercise logs
    await updateExerciseLogsForWorkout(
        userId,
        workoutLogId,
        routineName,
        startTime,
        exercisesCompleted
    );
};

// Delete a workout log and its associated exercise logs
export const deleteWorkoutLog = async (
    userId: string,
    workoutLogId: string
): Promise<void> => {
    // Delete associated exercise logs first
    await deleteExerciseLogsByWorkout(userId, workoutLogId);

    // Then delete the workout log
    const logRef = doc(db, 'users', userId, 'workout_logs', workoutLogId);
    await deleteDoc(logRef);
};

// Get all workout logs for a user
export const getWorkoutLogs = async (
    userId: string,
    limitCount: number = 50
): Promise<WorkoutLog[]> => {
    const logsRef = getWorkoutLogsRef(userId);
    const q = query(logsRef, orderBy('startTime', 'desc'), limit(limitCount));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            routineId: data.routineId,
            routineName: data.routineName,
            startTime: data.startTime.toDate(),
            endTime: data.endTime.toDate(),
            exercisesCompleted: data.exercisesCompleted.map((ex: { name: string; sets: Array<{ weight: number; reps: number; timestamp: Timestamp }> }) => ({
                name: ex.name,
                sets: ex.sets.map(set => ({
                    weight: set.weight,
                    reps: set.reps,
                    timestamp: set.timestamp.toDate()
                }))
            }))
        };
    });
};

// Get workout stats
export const getWorkoutStats = async (userId: string) => {
    const logs = await getWorkoutLogs(userId, 100);

    const totalWorkouts = logs.length;
    const totalSets = logs.reduce((acc, log) =>
        acc + log.exercisesCompleted.reduce((setAcc, ex) => setAcc + ex.sets.length, 0), 0
    );
    const totalWeight = logs.reduce((acc, log) =>
        acc + log.exercisesCompleted.reduce((exAcc, ex) =>
            exAcc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0), 0
        ), 0
    );
    const totalDuration = logs.reduce((acc, log) =>
        acc + (log.endTime.getTime() - log.startTime.getTime()) / 1000 / 60, 0
    ); // minutes

    return {
        totalWorkouts,
        totalSets,
        totalWeight,
        totalDuration: Math.round(totalDuration)
    };
};
