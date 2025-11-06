"use client"

import { useStudent } from "@/app/contexts/student-context";
import DataCell from "../cell/dataCell/dataCell";
import HeadCell from "../cell/headCell/headCell"
import { handleTableRowClickEvent, StudentListDetail } from "@/app/(students)/students";
import { useRouter } from "next/navigation";
import { formatUtcToLocal } from "@/app/utils/datetime";

export type TableRowProps = {
    columnHeaders: string[];
    rowData?: StudentListDetail;
    onDeleteClick?: (id: string) => void;
    index?: number;
}

export type StudentDeleteParams = {
    id: string;
}

const TableRow = ({columnHeaders, rowData, onDeleteClick, index}: TableRowProps) => {
    const router = useRouter();
    const { setSelectedStudent } = useStudent();

    if(columnHeaders && columnHeaders.length > 0) {
        return (
            <tr className="my-4 text-textprimary">
                {columnHeaders?.map((header) => (
                    <HeadCell key={header} text={header} />
                ))}
            </tr>
        )
    } else if(rowData) {
        const studentId = rowData.id;
        
        // Define keys to exclude from the main data loop
        const excludeKeys = new Set([
            "id", "user_id", 
            "created_at", "created_by", 
            "updated_at", "updated_by",
            "status"
        ]);
        return (
            <tr className={`text-textprimary hover:bg-primary/25 hover:text-textprimary`}>
                <td
                    onClick={() => {handleTableRowClickEvent(studentId, setSelectedStudent, router)}} 
                    className="border-subtle border-2 hover:cursor-pointer px-4 py-2"
                >
                    {index}
                </td>
                {Object.entries(rowData).map(([key, value]) => {
                    if(excludeKeys.has(key)) {
                        return null;
                    }
                    return (
                        <DataCell 
                            key={`${studentId}-${key}`} 
                            cellData={value as string} 
                            studentId={studentId}
                            clickable={key == 'name'}
                        />
                    );
                })}

                <DataCell 
                    cellData={rowData.updated_by? rowData.updated_by : "N/A"} 
                    studentId={studentId}
                />

                <DataCell 
                    cellData={formatUtcToLocal(rowData.updated_at)} 
                    studentId={studentId}
                />

                <td className="border-subtle border-2 text-center">
                    {rowData.user_id ? '✓' : ''}
                </td>
                <td className="border-subtle border-2">
                    <button 
                        onClick={() => onDeleteClick && onDeleteClick(rowData.id.toString())} 
                        className="
                            py-1 px-2  
                            mx-1 my-1 align-middle
                            bg-destructive hover:bg-destructive/90 rounded-md shadow-md 
                            text-textprimary font-bold 
                            focus:outline-none focus:ring-1 focus:ring-destructive focus:ring-opacity-75
                            transition duration-150 ease-in-out
                        "
                    >
                        Delete
                    </button>
                    <button 
                        onClick={() => {handleTableRowClickEvent(studentId, setSelectedStudent, router)}} 
                        className="
                            py-1 px-4  
                            mx-1 my-1 align-middle
                            bg-primary hover:bg-primary/90 rounded-lg shadow-md 
                            text-textprimary font-bold hover:text-textprimary
                            focus:outline-none focus:ring-1 focus:ring-primary focus:ring-opacity-75
                            transition duration-150 ease-in-out
                        "
                    >
                        Edit
                    </button>
                </td>
            </tr>
        )
    } else {
        return (
            <tr>
                <DataCell cellData="" studentId={0} />
            </tr>
        )
    }
}

export default TableRow;