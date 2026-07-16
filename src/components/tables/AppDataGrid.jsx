import { useState } from "react";
import { 
    Box, Skeleton, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TablePagination 
} from "@mui/material";
import SearchToolbar from "./SearchToolbar";

export function AppDataGrid({
    rows = [],
    columns = [],
    loading = false,
    onRowClick,
    exportFileName = "export.csv",
    placeholder = "Search records...",
    searchField = "", // The key to search on (or empty for universal search)
    ...props
}) {
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    // Filter rows based on quick search
    const filteredRows = rows.filter((row) => {
        if (!searchText) return true;
        const query = searchText.toLowerCase();
        
        if (searchField && row[searchField]) {
            return String(row[searchField]).toLowerCase().includes(query);
        }

        // Universal check across all columns
        return Object.keys(row).some((key) => {
            const val = row[key];
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(query);
        });
    });

    const handleSearchChange = (text) => {
        setSearchText(text);
        setPage(0); // Reset page to 0 on new search query
    };

    // Custom CSV Exporter using Blob
    const handleCSVExport = () => {
        const activeFields = columns
            .filter((col) => col.field !== "__actions" && col.field !== "actions" && col.headerName)
            .map((col) => col.field);
        
        const headers = columns
            .filter((col) => col.field !== "__actions" && col.field !== "actions" && col.headerName)
            .map((col) => col.headerName);

        const csvRows = [headers.join(",")];

        filteredRows.forEach((row) => {
            const values = activeFields.map((field) => {
                const val = row[field];
                const cellValue = val === null || val === undefined ? "" : String(val).replace(/\n/g, " ").replace(/"/g, '""');
                return `"${cellValue}"`;
            });
            csvRows.push(values.join(","));
        });

        const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", exportFileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const displayRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper 
            elevation={1} 
            sx={{ 
                width: "100%", 
                display: "flex", 
                flexDirection: "column", 
                borderRadius: 3, 
                overflow: "hidden" 
            }}
        >
            <SearchToolbar
                searchText={searchText}
                onSearchChange={handleSearchChange}
                placeholder={placeholder}
                onExport={handleCSVExport}
            />

            <TableContainer sx={{ maxHeight: 420 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.field}
                                    align={column.align || "left"}
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        backgroundColor: (theme) => theme.palette.mode === "dark" ? "#1f2937" : "#f1f5f9",
                                        color: "text.primary",
                                        py: 1.5,
                                        width: column.width || "auto"
                                    }}
                                >
                                    {column.headerName}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: rowsPerPage }).map((_, idx) => (
                                <TableRow key={idx}>
                                    {columns.map((col) => (
                                        <TableCell key={col.field} sx={{ py: 1.5 }}>
                                            <Skeleton variant="text" width="80%" height={24} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : displayRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: "text.secondary" }}>
                                    No records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayRows.map((row) => (
                                <TableRow
                                    hover
                                    key={row.id || row.employeeId || Math.random()}
                                    onClick={() => onRowClick && onRowClick({ row })}
                                    sx={{
                                        cursor: onRowClick ? "pointer" : "default",
                                        "&:hover": {
                                            backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(99, 102, 241, 0.05) !important" : "rgba(79, 70, 229, 0.03) !important"
                                        }
                                    }}
                                >
                                    {columns.map((column) => {
                                        const value = row[column.field];
                                        const cellParams = {
                                            row,
                                            value,
                                            id: row.id
                                        };
                                        const cellContent = column.renderCell ? column.renderCell(cellParams) : value;
                                        return (
                                            <TableCell key={column.field} align={column.align || "left"} sx={{ py: 1, fontSize: "0.875rem" }}>
                                                {cellContent}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page * rowsPerPage >= filteredRows.length ? 0 : page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    borderTop: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper"
                }}
            />
        </Paper>
    );
}

export default AppDataGrid;
