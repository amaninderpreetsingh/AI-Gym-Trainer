import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    getDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Routine, Exercise } from '../types';

// Get the routines collection reference for a user
const getRoutinesRef = (userId: string) =>
    collection(db, 'users', userId, 'routines');

// Create a new routine
export const createRoutine = async (
    userId: string,
    name: string,
    exercises: Exercise[]
): Promise<string> => {
    const routinesRef = getRoutinesRef(userId);

    const docRef = await addDoc(routinesRef, {
        name,
        exercises,
        createdAt: Timestamp.now()
    });

    return docRef.id;
};

// Update an existing routine
export const updateRoutine = async (
    userId: string,
    routineId: string,
    name: string,
    exercises: Exercise[]
): Promise<void> => {
    const routineRef = doc(db, 'users', userId, 'routines', routineId);

    await updateDoc(routineRef, {
        name,
        exercises,
        updatedAt: Timestamp.now()
    });
};

// Get all routines for a user
export const getRoutines = async (userId: string): Promise<Routine[]> => {
    const routinesRef = getRoutinesRef(userId);
    const q = query(routinesRef, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        exercises: doc.data().exercises,
        createdAt: doc.data().createdAt.toDate()
    }));
};

// Get a single routine by ID
export const getRoutine = async (
    userId: string,
    routineId: string
): Promise<Routine | null> => {
    const routineRef = doc(db, 'users', userId, 'routines', routineId);
    const snapshot = await getDoc(routineRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        name: snapshot.data().name,
        exercises: snapshot.data().exercises,
        createdAt: snapshot.data().createdAt.toDate()
    };
};

// Delete a routine
export const deleteRoutine = async (
    userId: string,
    routineId: string
): Promise<void> => {
    const routineRef = doc(db, 'users', userId, 'routines', routineId);
    await deleteDoc(routineRef);
};

// Get muscle group map from a routine (helper for workout logging)
export const getExerciseMuscleGroupMap = (routine: Routine): Record<string, string> => {
    const map: Record<string, string> = {};
    routine.exercises.forEach(exercise => {
        map[exercise.name] = exercise.muscleGroup;
    });
    return map;
};
