"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '../../hooks/modal/useModal';
import Modal from '../../custom-components/modal/modal';
import { catchError } from '../../routes/route_utils';
import { useContent } from '@/app/contexts/content-context';
import { useAuth } from '@/app/contexts/auth-context';
import { AddContentResponse, ContentConstraint, TextContent } from '../content';
import { Course } from '@/app/(course)/course';

const ContentForm = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedContent, setSelectedContent } = useContent();
    const [isEditMode, setIsEditMode] = useState(!!selectedContent);

    const [title, setTitle] = useState(() => selectedContent?.title || '');
    const [textContent, setTextContent] = useState(() => (selectedContent as TextContent)?.text_content || '');
    
    const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>(
        () => (selectedContent as TextContent)?.class_levels || []
    );
    const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>(
        () => (selectedContent as TextContent)?.course_codes || []
    );

    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [allClasses, setAllClasses] = useState<string[]>([]);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [tempSelectedClasses, setTempSelectedClasses] = useState<string[]>([]);
    const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const [initialState, setInitialState] = useState(() => ({
        title: selectedContent?.title || '',
        textContent: (selectedContent as TextContent)?.text_content || '',
        selectedClassLevels: (selectedContent as TextContent)?.class_levels || [],
        selectedCourseCodes: (selectedContent as TextContent)?.course_codes || [],
    }));

    const router = useRouter();
    const { isOpen: isCancelModalOpen, showModal: showCancelModal, hideModal: hideCancelModal, message: cancelMessage, onOk: onCancelConfirm } = useModal();
    const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
    const [newContentTitle, setNewContentTitle] = useState('');

    const hasChanges = useCallback(() => {
        return title !== initialState.title || 
               textContent !== initialState.textContent ||
               JSON.stringify(selectedClassLevels.sort()) !== JSON.stringify(initialState.selectedClassLevels.sort()) ||
               JSON.stringify(selectedCourseCodes.sort()) !== JSON.stringify(initialState.selectedCourseCodes.sort());
    }, [title, textContent, selectedClassLevels, selectedCourseCodes, initialState]);

    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            try {
                const [courseResponse, classResponse] = await Promise.all([
                    fetch('/routes/get-all-courses', {
                        method: "GET",
                        headers: { "Content-Type" : "application/json" },
                    }),
                    fetch('/routes/get-all-classes', {
                        method: "GET",
                        headers: { "Content-Type" : "application/json" },
                    })
                ]);

                if (!courseResponse.ok) throw new Error('Failed to fetch courses');
                const coursesData: Course[] = await courseResponse.json();
                setAllCourses(coursesData);

                if (!classResponse.ok) throw new Error('Failed to fetch classes');
                const classData: string[] = await classResponse.json();
                setAllClasses(classData);                

            } catch (error) {
                catchError(error, 'Error fetching initial data. Reason: ', 'Error fetching initial data.');
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!selectedContent) {
            setIsEditMode(false);
            setTitle('');
            setTextContent('');
            setSelectedClassLevels([]);
            setSelectedCourseCodes([]);
            setInitialState({ title: '', textContent: '', selectedClassLevels: [], selectedCourseCodes: [] });
        }
    }, [selectedContent]);

    useEffect(() => {
        setIsSaveDisabled(!hasChanges() || !title.trim());
    }, [title, textContent, selectedClassLevels, selectedCourseCodes, hasChanges]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const contentData = { 
            title: title, 
            text_content: textContent,
            class_levels: selectedClassLevels, // Send selected classes
            course_codes: selectedCourseCodes, // Send selected courses
            file_type: "text",
            author: null,
        };
        
        const url = isEditMode
            ? `/routes/update-text-content/${selectedContent?.id}`
            : '/routes/create-text-content';
        
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'add'} content`);
            }

            if (isEditMode) {
                setSelectedContent(null);
                router.push('/contents');
            } else {
                const newContentResponse: AddContentResponse = await response.json();
                setNewContentTitle(newContentResponse.content.title || '');
                setSuccessModalOpen(true);
            }
        } catch (error) {
            catchError(error, `Error ${isEditMode ? 'updating' : 'adding'} content: `, `Unknown error while ${isEditMode ? 'updating' : 'adding'} content`);
        }
    };

    const handleCancelClick = () => {
        const navigateAway = () => {
            setSelectedContent(null);
            router.push('/contents');
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
        setTitle('');
        setTextContent('');
        setSelectedClassLevels([]);
        setSelectedCourseCodes([]);
        setInitialState({ title: '', textContent: '', selectedClassLevels: [], selectedCourseCodes: [] });
    };

    const handleReturnToList = () => {
        setSuccessModalOpen(false);
        setSelectedContent(null);
        router.push('/contents');
    };

    // --- Modal Handlers ---

    const handleOpenClassModal = () => {
        // This function is now guaranteed to read the correct state
        setTempSelectedClasses([...selectedClassLevels]);
        setIsClassModalOpen(true);
    };

    const handleClassModalOk = () => {
        setSelectedClassLevels([...tempSelectedClasses]);
        setIsClassModalOpen(false);
    };

    const handleClassModalCancel = () => {
        // setTempSelectedClasses([]); // This line is not necessary and can be removed
        setIsClassModalOpen(false);
    };

    const handleClassCheckboxChange = (className: string) => {
        setTempSelectedClasses(prev => 
            prev.includes(className)
                ? prev.filter(c => c !== className)
                : [...prev, className]
        );
    };

    const handleOpenCourseModal = () => {
        // This function is now guaranteed to read the correct state
        setTempSelectedCourses([...selectedCourseCodes]);
        setIsCourseModalOpen(true);
    };

    const handleCourseModalOk = () => {
        setSelectedCourseCodes([...tempSelectedCourses]);
        setIsCourseModalOpen(false);
    };

    const handleCourseModalCancel = () => {
        // setTempSelectedCourses([]); // This line is not necessary and can be removed
        setIsCourseModalOpen(false);
    };

    const handleCourseCheckboxChange = (courseCode: string) => {
        setTempSelectedCourses(prev => 
            prev.includes(courseCode)
                ? prev.filter(c => c !== courseCode)
                : [...prev, courseCode]
        );
    };

    // --- Loading/Permission Checks ---

    if (authLoading || dataLoading) {
        return <p className="p-4 text-center">Loading...</p>;
    }

    if (role !== "A") {
        return (
            <div className="p-4 text-center text-destructive">
                You do not have permission to access this resource
            </div>
        );
    }

    // --- Render ---

    return (
        <div className="p-4 max-w-2xl mx-auto">
            {/* Cancel Confirmation Modal */}
            <Modal isOpen={isCancelModalOpen} onOk={onCancelConfirm || undefined} onClose={hideCancelModal} message={cancelMessage} showCancelButton={true} />
            
            {/* Add Success Modal */}
            <Modal
                isOpen={isSuccessModalOpen}
                message={`Successfully added "${newContentTitle}". Would you like to add another?`}
                onOk={handleAddAnother}
                onClose={handleReturnToList}
                showCancelButton={true}
                okText="Yes, Add Another"
                cancelText="No, View List"
            />

            {/* Class Selection Modal */}
            <Modal
                isOpen={isClassModalOpen}
                onOk={handleClassModalOk}
                onClose={handleClassModalCancel}
                showCancelButton={true}
                okText="OK"
            >
                <h3 className="text-lg font-bold mb-4">Select Classes</h3>
                <div className="space-y-2 grid grid-cols-2 gap-2">
                    {allClasses.length > 0 ? allClasses.map(className => (
                        <label key={className} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-active">
                            <input
                                type="checkbox"
                                checked={tempSelectedClasses.includes(className)}
                                onChange={() => handleClassCheckboxChange(className)}
                                className="form-checkbox h-5 w-5 text-primary bg-surface border-subtle"
                            />
                            {className}
                        </label>
                    )) : <p>No classes found.</p>}
                </div>
            </Modal>

            {/* Course Selection Modal */}
            <Modal
                isOpen={isCourseModalOpen}
                onOk={handleCourseModalOk}
                onClose={handleCourseModalCancel}
                showCancelButton={true}
                okText="OK"
            >
                <h3 className="text-lg font-bold mb-4">Select Courses</h3>
                <div className="space-y-2">
                    {allCourses.length > 0 ? allCourses.map(course => (
                        <label key={course.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-active">
                            <input
                                type="checkbox"
                                checked={tempSelectedCourses.includes(course.course_code)}
                                onChange={() => handleCourseCheckboxChange(course.course_code)}
                                className="form-checkbox h-5 w-5 text-primary bg-surface border-subtle"
                            />
                            {course.name} ({course.course_code})
                        </label>
                    )) : <p>No courses found.</p>}
                </div>
            </Modal>

            {/* Main Form */}
            <h1 className="text-xl font-bold mb-4">{isEditMode ? 'Edit Content' : 'Add New Content'}</h1>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface"
                    />
                </div>
                
                {/* --- Associations --- */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Associations</h3>
                    <div className="flex gap-4">
                        <button type="button" onClick={handleOpenClassModal} className="py-2 px-4 bg-secondary hover:bg-secondary/90 rounded-lg shadow-md text-textprimary font-bold">
                            Select Classes
                        </button>
                        <button type="button" onClick={handleOpenCourseModal} className="py-2 px-4 bg-secondary hover:bg-secondary/90 rounded-lg shadow-md text-textprimary font-bold">
                            Select Courses
                        </button>
                    </div>
                    <div className="p-2 bg-surface-active rounded-md min-h-[40px] text-sm">
                        <p><strong>Selected Classes:</strong> {selectedClassLevels.length > 0 ? selectedClassLevels.join(', ') : 'None'}</p>
                        <p><strong>Selected Courses:</strong> {selectedCourseCodes.length > 0 ? selectedCourseCodes.join(', ') : 'None'}</p>
                    </div>
                </div>

                <div>
                    <label htmlFor="textContent" className="block text-sm font-medium">Content</label>
                    <textarea
                        id="textContent"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={15}
                        className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={handleCancelClick} className="py-2 px-4 bg-destructive hover:bg-destructive/90 rounded-lg shadow-md text-textprimary font-bold">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSaveDisabled} className="py-2 px-4 bg-primary hover:bg-primary/90 rounded-lg shadow-md text-textprimary font-bold disabled:bg-disabled disabled:cursor-not-allowed">
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContentForm;