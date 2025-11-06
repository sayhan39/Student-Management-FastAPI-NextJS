import TableRow from "../row/row";
import { StudentListDetail } from "@/app/(students)/students";

export type TableBodyProps = {
    tableData: StudentListDetail[];
    onRowDeleteClick: (id: string) => void;
}

const TableBody = ({tableData, onRowDeleteClick}: TableBodyProps) => {

    return (
        <>
            <tbody className="table-body">
                {tableData.map((data, lowerIndex) => (
                    <TableRow 
                        key={data.id} 
                        columnHeaders={[]} 
                        rowData={data} 
                        onDeleteClick={() => {onRowDeleteClick(data.id.toString())}
                        } 
                        index={lowerIndex + 1}
                    />
                ))}
            </tbody>
        </>
    )
}

export default TableBody;