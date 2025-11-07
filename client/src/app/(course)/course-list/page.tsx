"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useModal } from "@/app/hooks/modal/useModal";
import Modal from "@/app/custom-components/modal/modal";
import { useCourse } from "@/app/contexts/course-context";
import { Course } from "../course";
import { useAuth } from "@/app/contexts/auth-context";
import { catchError } from "@/app/routes/route_utils";

const CourseList = () => {
    const { courses, setCourses, setSelectedCourse } = useCourse();
    const { isOpen, showModal, hideModal, message } = useModal();
    const { role, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);
    const router = useRouter();
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    const handleEditClick = (course: Course) => {
        setSelectedCourse(course);
        router.push('/course-form');
    };

    const handleDeleteClick = (course: Course) => {
        setCourseToDelete(course);
        showModal(`Are you sure about deleting ${course.course_code}?`);
    };

    const confirmDelete = async () => {
        if (!courseToDelete) return;
        try {
            const response = await fetch('/routes/delete-course', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: courseToDelete.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete course');
            }

            setCourses(courses.filter(course => course.id !== courseToDelete.id));
        } catch (error) {
            catchError(error, "Error deleting course: ", "Unknown error while deleting course");
        } finally {
            hideModal();
            setCourseToDelete(null);
        }
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const response = await fetch('/routes/get-all-courses', {
                method: "GET",
                headers: { "Content-Type" : "application/json" },
            });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Failed to fetch courses");
                }
                const data = await response.json();
                setCourses(data);
            } catch (error: unknown) {
                catchError(error, "Error fetching courses: ", "Unknown error while fetching courses");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [setCourses]);

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

    if(loading) {
        return (
            <main className="flex flex-col items-center">
                {error && <p className="text-destructive">Error: {error} </p>}
                {!error && <p className="text-textprimary">Loading...</p>}
            </main>
        );
    }

    if (error) return <p className="text-destructive">Error: {error}</p>;

    return (
        <div className="p-4">
             <Modal
                isOpen={isOpen}
                onOk={confirmDelete}
                onClose={() => {
                    hideModal();
                    setCourseToDelete(null);
                }}
                message={message}
                showCancelButton={true}
                okText="Yes"
                cancelText="No"
            />
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-textprimary">Courses</h1>
                <Link 
                    href="/course-form" 
                    onClick={() => setSelectedCourse(null)}
                    className="py-2 px-4 bg-primary hover:bg-primary/90 rounded-lg shadow-md text-textprimary font-bold focus:outline-none focus:ring-1 focus:ring-primary transition duration-150 ease-in-out"
                >
                    + Add Course
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-surface">
                        <tr>
                            <th className="px-6 py-3 border-subtle border-2">Course Name</th>
                            <th className="px-6 py-3 border-subtle border-2">Course Code</th>
                            <th className="px-6 py-3 border-subtle border-2">Description</th>
                            <th className="px-6 py-3 border-subtle border-2">Credits</th>
                            <th className="px-6 py-3 border-subtle border-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course) => (
                            <tr key={course.id} className="border-b border-subtle hover:bg-surface/10">
                                <td className="px-6 py-4 border-subtle border-2">{course.name}</td>
                                <td className="px-6 py-4 border-subtle border-2">{course.course_code}</td>
                                <td className="px-6 py-4 border-subtle border-2">{course.description}</td>
                                <td className="px-6 py-4 border-subtle border-2">{course.credits}</td>
                                <td className="px-6 py-4 border-subtle border-2 text-center">
                                    <button onClick={() => handleEditClick(course)} className="font-medium text-primary hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteClick(course)} className="font-medium text-destructive hover:underline ml-4">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseList;