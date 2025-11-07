"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '../../hooks/modal/useModal';
import Modal from '../../custom-components/modal/modal';
import { catchError } from '../../routes/route_utils';
import { useContent } from '@/app/contexts/content-context';
import { useAuth } from '@/app/contexts/auth-context';
import { AddContentResponse, TextContent } from '../content';
import { Course } from '@/app/(course)/course';

const ContentForm = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedContent, setSelectedContent } = useContent();
    const [isEditMode, setIsEditMode] = useState(!!selectedContent);

    const [title, setTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>([]);
    const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);

    const [isSaveDisabled, setIsSaveDisabled] = useState(true);

    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [allClasses, setAllClasses] = useState<string[]>([]);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [tempSelectedClasses, setTempSelectedClasses] = useState<string[]>([]);
    const [tempSelectedCourses, setTempSelectedCourses] = useState<string[]>([]);

    const [constraintsLoading, setConstraintsLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false); 

    const [initialState, setInitialState] = useState({
        title: '',
        textContent: '',
        selectedClassLevels: [] as string[],
        selectedCourseCodes: [] as string[],
    });

    const router = useRouter();
    const { isOpen: isCancelModalOpen, showModal: showCancelModal, hideModal: hideCancelModal, message: cancelMessage, onOk: onCancelConfirm } = useModal();
    const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
    const [newContentTitle, setNewContentTitle] = useState('');

    const hasChanges = useCallback(() => {
        const baseChanges = title !== initialState.title || 
               JSON.stringify(selectedClassLevels.sort()) !== JSON.stringify(initialState.selectedClassLevels.sort()) ||
               JSON.stringify(selectedCourseCodes.sort()) !== JSON.stringify(initialState.selectedCourseCodes.sort());

        if (!isEditMode) {
            return baseChanges || textContent !== initialState.textContent || file !== null;
        }

        if (selectedContent?.file_type !== 'text/plain') {
            return baseChanges || file !== null;
        } else {
            return baseChanges || textContent !== initialState.textContent;
        }
    }, [title, textContent, selectedClassLevels, selectedCourseCodes, initialState, isEditMode, selectedContent, file]);

    useEffect(() => {
        const fetchData = async () => {
            setConstraintsLoading(true);
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
                setConstraintsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        setFile(null);

        if (isEditMode && selectedContent) {
            const fullContent = selectedContent as TextContent;

            if (fullContent.text_content !== undefined || fullContent.class_levels !== undefined) {
                setTitle(fullContent.title || '');
                setTextContent(fullContent.text_content || '');
                setSelectedClassLevels(fullContent.class_levels || []);
                setSelectedCourseCodes(fullContent.course_codes || []);

                setInitialState({
                    title: fullContent.title || '',
                    textContent: fullContent.text_content || '',
                    selectedClassLevels: fullContent.class_levels || [],
                    selectedCourseCodes: fullContent.course_codes || [],
                });

            } else {
                setContentLoading(true);
                const fetchFullContent = async () => {
                    try {
                        if (selectedContent.file_type === 'text/plain') {
                            const response = await fetch(`/routes/get-text-content/${selectedContent.id}`);
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.detail || 'Failed to fetch content details');
                            }
                            const fetchedContent: TextContent = await response.json();

                            setTitle(fetchedContent.title || '');
                            setTextContent(fetchedContent.text_content || '');
                            setSelectedClassLevels(fetchedContent.class_levels || []);
                            setSelectedCourseCodes(fetchedContent.course_codes || []);

                            setInitialState({
                                title: fetchedContent.title || '',
                                textContent: fetchedContent.text_content || '',
                                selectedClassLevels: fetchedContent.class_levels || [],
                                selectedCourseCodes: fetchedContent.course_codes || [],
                            });

                        } else {
                            setTitle(selectedContent.title || '');
                            setSelectedClassLevels([]);
                            setSelectedCourseCodes([]);

                            setInitialState({
                                title: selectedContent.title || '',
                                textContent: '',
                                selectedClassLevels: [],
                                selectedCourseCodes: [],
                            });
                        }
                    } catch (error) {
                        catchError(error, "Error fetching content details: ", "Unknown error fetching content");
                    } finally {
                        setContentLoading(false);
                    }
                };
                fetchFullContent();
            }
        } else {
            setTitle('');
            setTextContent('');
            setSelectedClassLevels([]);
            setSelectedCourseCodes([]);
            setInitialState({
                title: '',
                textContent: '',
                selectedClassLevels: [],
                selectedCourseCodes: [],
            });
            setIsEditMode(false);
        }
    }, [isEditMode, selectedContent]); 

    useEffect(() => {
        const noChanges = !hasChanges();
        const noTitle = !title.trim();

        const creatingFileWithoutFile = !isEditMode && file === null && textContent.trim() === '';

        setIsSaveDisabled(noChanges || noTitle || creatingFileWithoutFile);

    }, [title, textContent, selectedClassLevels, selectedCourseCodes, hasChanges, file, initialState, isEditMode]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const isTextContentOperation = (isEditMode && selectedContent?.file_type === 'text/plain') || (!isEditMode && !file);

        if (isTextContentOperation) {
            const contentData = { 
                title: title, 
                text_content: textContent,
                class_levels: selectedClassLevels,
                course_codes: selectedCourseCodes,
                file_type: "text/plain",
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

        } else {
            const formData = new FormData();
            formData.append('title', title);
            selectedClassLevels.forEach(level => formData.append('class_levels', level));
            selectedCourseCodes.forEach(code => formData.append('course_codes', code));

            let url = '';
            let method = '';

            if (isEditMode) {
                url = `/routes/update-file-content/${selectedContent?.id}`;
                method = 'PUT';
                if (file) {
                    formData.append('file', file);
                }
            } else {
                url = `/routes/create-file-content`;
                method = 'POST';
                if (file) {
                    formData.append('file', file);
                } else {
                    showCancelModal("Please select a file to create new content.", hideCancelModal);
                    return;
                }
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || `Failed to ${method === 'POST' ? 'create' : 'update'} file content`);
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
                 catchError(error, `Error ${method === 'POST' ? 'creating' : 'updating'} file content: `, `Unknown error while ${method === 'POST' ? 'creating' : 'updating'} file content`);
            }
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
        setSelectedContent(null);
        setIsEditMode(false);
    };

    const handleReturnToList = () => {
        setSuccessModalOpen(false);
        setSelectedContent(null);
        router.push('/contents');
    };

    const handleOpenClassModal = () => {
        setTempSelectedClasses([...selectedClassLevels]);
        setIsClassModalOpen(true);
    };

    const handleClassModalOk = () => {
        setSelectedClassLevels([...tempSelectedClasses]);
        setIsClassModalOpen(false);
    };

    const handleClassModalCancel = () => {
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
        setTempSelectedCourses([...selectedCourseCodes]);
        setIsCourseModalOpen(true);
    };

    const handleCourseModalOk = () => {
        setSelectedCourseCodes([...tempSelectedCourses]);
        setIsCourseModalOpen(false);
    };

    const handleCourseModalCancel = () => {
        setIsCourseModalOpen(false);
    };

    const handleCourseCheckboxChange = (courseCode: string) => {
        setTempSelectedCourses(prev => 
            prev.includes(courseCode)
                ? prev.filter(c => c !== courseCode)
                : [...prev, courseCode]
        );
    };

    if (authLoading || constraintsLoading || contentLoading) {
        return <p className="p-4 text-center">Loading...</p>;
    }

    if (role !== "A") {
        return (
            <div className="p-4 text-center text-destructive">
                You do not have permission to access this resource
            </div>
        );
    }

    const showFileInput = (isEditMode && selectedContent?.file_type !== 'text/plain') || (!isEditMode && file !== null);

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Modal isOpen={isCancelModalOpen} onOk={onCancelConfirm || undefined} onClose={hideCancelModal} message={cancelMessage} showCancelButton={true} />
            <Modal
                isOpen={isSuccessModalOpen}
                message={`Successfully added "${newContentTitle}". Would you like to add another?`}
                onOk={handleAddAnother}
                onClose={handleReturnToList}
                showCancelButton={true}
                okText="Yes, Add Another"
                cancelText="No, View List"
            />
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
                    <label htmlFor="content" className="block text-sm font-medium">Content</label>

                    { (isEditMode && selectedContent?.file_type !== 'text/plain') ? (
                        <input
                            id="contentFile"
                            type="file"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-textprimary file:font-bold hover:file:bg-primary/90"
                        />
                    ) : (
                        <>
                            <textarea
                                id="textContent"
                                value={textContent}
                                onChange={(e) => {
                                    setTextContent(e.target.value);
                                    if(e.target.value.trim() !== '') setFile(null);
                                }}
                                rows={15}
                                className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface"
                                disabled={!isEditMode && file !== null}
                            />

                            {!isEditMode && (
                                <>
                                <p className="text-sm text-textsecondary text-center my-2">OR</p>
                                <input
                                    id="contentFile"
                                    type="file"
                                    onChange={(e) => {
                                        const selectedFile = e.target.files ? e.target.files[0] : null;
                                        setFile(selectedFile);
                                        if (selectedFile) setTextContent('');
                                    }}
                                    className="mt-1 block w-full p-2 border-subtle border-2 rounded-md bg-surface file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-textprimary file:font-bold hover:file:bg-primary/90"
                                    disabled={!isEditMode && textContent.trim() !== ''}
                                />
                                </>
                            )}
                        </>
                    )}
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