"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '../../hooks/modal/useModal';
import Modal from '../../custom-components/modal/modal';
import { catchError } from '../../routes/route_utils';
import { Course } from '../course';
import { useCourse } from '@/app/contexts/course-context';
import { useAuth } from '@/app/contexts/auth-context';

const CourseForm = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedCourse, setSelectedCourse } = useCourse();
    const [isEditMode, setIsEditMode] = useState(false);

    const [id, setId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [description, setDescription] = useState('');
    const [credits, setCredits] = useState(0);
    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    const [initialState, setInitialState] = useState({
        name: '',
        courseCode: '',
        description: '',
        credits: 0,
    });

    const router = useRouter();
    const { isOpen: isCancelModalOpen, showModal: showCancelModal, hideModal: hideCancelModal, message: cancelMessage, onOk: onCancelConfirm } = useModal();
    const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
    const [newCourseCode, setNewCourseCode] = useState('');

    const resetFormForCreate = () => {
        setId(null);
        setName('');
        setCourseCode('');
        setDescription('');
        setCredits(0);
        setInitialState({ name: '', courseCode: '', description: '', credits: 0 });
    };

    const hasChanges = useCallback(() => {
        if (isEditMode) {
            return (
                name !== initialState.name ||
                courseCode !== initialState.courseCode ||
                description !== initialState.description ||
                credits !== initialState.credits
            );
        }
        return name !== '' || courseCode !== '' || description !== '' || credits !== 0;
    }, [courseCode, credits, description, initialState, isEditMode, name]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const courseData = { id, name, course_code: courseCode, description, credits };
        const url = isEditMode ? `/routes/update-course` : '/routes/add-course';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'add'} course`);
            }

            if (isEditMode) {
                setSelectedCourse(null);
                router.push('/course-list');
            } else {
                const newCourse: Course = await response.json();
                setNewCourseCode(newCourse.course_code);
                setSuccessModalOpen(true);
            }
        } catch (error) {
            catchError(error, `Error ${isEditMode ? 'updating' : 'adding'} course: `, `Unknown error while ${isEditMode ? 'updating' : 'adding'} course`);
        }
    };

    const handleCancelClick = () => {
        const navigateAway = () => {
            setSelectedCourse(null);
            router.push('/course-list');
        };

        if (hasChanges()) {
            showCancelModal(
                "Are you sure you want to cancel? Any unsaved changes will be lost.",
                navigateAway
            );
        } else {
            navigateAway();
        }
    };

    const handleAddAnother = () => {
        setSuccessModalOpen(false);
        resetFormForCreate();
    };

    const handleReturnToList = () => {
        setSuccessModalOpen(false);
        setSelectedCourse(null);
        router.push('/course-list');
    };

    useEffect(() => {
        if (selectedCourse) {
            setIsEditMode(true);
            const { id, name, course_code, description, credits } = selectedCourse;
            setId(id);
            setName(name);
            setCourseCode(course_code);
            setDescription(description || '');
            setCredits(credits || 0);

            setInitialState({
                name: name,
                courseCode: course_code,
                description: description || '',
                credits: credits || 0,
            });
        } else {
            setIsEditMode(false);
            resetFormForCreate();
        }
    }, [selectedCourse]);

    useEffect(() => {
        setIsSaveDisabled(!hasChanges());
    }, [courseCode, credits, description, hasChanges, initialState, name]);

    if (authLoading) {
        return <p>Loading...</p>;
    }

    if (role !== "A") {
        return (
            <div className="p-4 text-center text-destructive">
                You do not have permission to access this resource
            </div>
        );
    }

    return (
        <div className="p-4">
            <Modal isOpen={isCancelModalOpen} onOk={onCancelConfirm || undefined} onClose={hideCancelModal} message={cancelMessage} showCancelButton={true} />
            <Modal
                isOpen={isSuccessModalOpen}
                message={`Successfully added a new course (${newCourseCode}). Would you like to add another course?`}
                onOk={handleAddAnother}
                onClose={handleReturnToList}
                showCancelButton={true}
                okText="Yes"
                cancelText="No"
            />
            <h1 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Course' : 'Add New Course'}</h1>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium">Course Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface"
                    />
                </div>
                <div>
                    <label htmlFor="courseCode" className="block text-sm font-medium">Course Code</label>
                    <input
                        id="courseCode"
                        type="text"
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface"
                    />
                </div>
                <div>
                    <label htmlFor="credits" className="block text-sm font-medium">Credits</label>
                    <input
                        id="credits"
                        type="number"
                        step="0.1"
                        value={credits}
                        onChange={(e) => setCredits(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        required
                        className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface no-arrows"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={handleCancelClick} className="py-2 px-4 bg-destructive hover:bg-destructive/90 rounded-lg shadow-md text-textprimary font-bold focus:outline-none focus:ring-1 focus:ring-destructive focus:ring-opacity-75 transition duration-150 ease-in-out">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaveDisabled} className="py-2 px-4 bg-primary hover:bg-primary/90 rounded-lg shadow-md text-textprimary font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:ring-opacity-75 transition duration-150 ease-in-out disabled:bg-disabled disabled:cursor-not-allowed">
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseForm;