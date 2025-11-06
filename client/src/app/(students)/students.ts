"use client"

import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { BaseRequestResponse } from "../dashboard/dashboard";

export const enum LEVEL {
    ONE=    "one",
    TWO=    "two",
    THREE=  "three",
    FOUR=   "four",
    FIVE=   "five",
    SIX=    "six",
    SEVEN=  "seven",
    EIGHT=  "eight",
    NINE=   "nine",
    TEN=    "ten"
}

export const enum MEDIUM {
    BANGLA =    "bangla",
    ENGLISH =   "english"
}

export interface AuditModel {
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    status?: string;
}

type StudentBase = {
    name?: string;
    roll?: number;
    level?: string;
    section?: string;
    medium?: string;
}& AuditModel

type Student = { 
    id: number;
    user_id?: number;
} & StudentBase

type StudentListDetail = {
    id: number;
    name?: string;
    roll?: number;
    level?: string;
    section?: string;
    medium?: string;
    updated_at?: string;
    updated_by?: string;
    user_id?: number;
}

type Performance = {
    student_id: number;
    course_id: number;
    attendance: number;
    semester: number;
    practical: number;
    in_course: number;
} & AuditModel

type UserBase = {
    username: string;
    email: string | null;
    full_name: string | null;
    disabled: boolean | null;
    password: string | null;
    role: string | null;
} & AuditModel

type User = { id: number } & UserBase;

type StudentUpdateResponseParams = {
    updated_student: string;
    response_message: string;
}

type AddUserRequest = {
    username: string;
    password: string;
    student_id: number;
    role: string;
    full_name?: string;
};

type StudentListResponse = BaseRequestResponse & {
    page_count?: number;
    students?: StudentListDetail[];
}

type FilterProps = {
    onFilterChange: (payload : FilterPayload) => void;
    currentFilters: FilterPayload
}

type FilterPayload = {
    property?: string;
    value?: string;
    activeFilter: boolean;
}

type EnumOption = { [key: string]: string };

const convertResponseToStudentList = (objects: Student[]) => {

    const studentList: StudentListDetail[] = [];
    objects.forEach((obj: Student) => {
        const student: StudentListDetail = {
            id:         obj.id,
            name:       obj.name,
            roll:       obj.roll,
            level:      obj.level,
            section:    obj.section,
            medium:     obj.medium,
            user_id:    obj.user_id,
            updated_at: obj.updated_at,
            updated_by: obj.updated_by
        };
        studentList.push(student)
    })
    return studentList;
}

const convertResponseToStudent = (object: Student) => {
    let fetchedStudent = {
        id:         object.id,
        name:       object.name,
        roll:       object.roll,
        level:      object.level,
        section:    object.section,
        medium:     object.medium,
        user_id:    object.user_id,
        updated_at: object.updated_at,
        updated_by: object.updated_by
    };
    return fetchedStudent;
}

const fetchStudentById = async(studentId: string, 
    setSelectedStudent?: (student: StudentListDetail) => void, 
    setStudent?: (student: Student) => void, 
    setError?: (err: string) => void, 
    setLoading?: (loading: boolean) => void, 
    setUpdatedStudent?: (student: Student) => void) => {
    try {
        const response: Response = await fetch(`/routes/student-details/${studentId}`, {
            method: "GET",
            headers: { "Content-Type" : "application/json" },
        });

        if(!response.ok) {
            const result = await response.json();
            throw new Error(result.detail);
        } else {
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            const object: Student = JSON.parse(responseText);
            const fetchedStudent = convertResponseToStudent(object);
            if(setSelectedStudent) {
                setSelectedStudent(fetchedStudent);
            }
            if(setStudent) {
                setStudent(fetchedStudent);
            }
            if(setUpdatedStudent) {
                setUpdatedStudent(fetchedStudent);
            }
        }
    } catch (err: unknown) {
        if(err instanceof Error) {
            if(setError) {
                setError(err.message);
            }
        } else {
            if(setError) {
                setError("Unknown Error. Caught at students.ts catch.");
            }
        }
    } finally {
        if(setLoading) {
            setLoading(false);
        }
    }
}

const handleTableRowClickEvent = (studentId: number, setSelectedStudent: (student: StudentListDetail) => void, 
    router: AppRouterInstance) => {

    setSelectedStudent({id: studentId})
    router.push(`../../../../student-details/${studentId.toString()}`);
}

export { convertResponseToStudentList, convertResponseToStudent, fetchStudentById, handleTableRowClickEvent }

export type { StudentBase, Student, StudentListDetail, Performance, StudentUpdateResponseParams, AddUserRequest, User, UserBase, StudentListResponse, FilterPayload, FilterProps, EnumOption }
