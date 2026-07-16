import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Skeleton, Paper } from "@mui/material";
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
    const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

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

    // Custom CSV Exporter using Blob
    const handleCSVExport = () => {
        const activeFields = columns
            .filter((col) => col.field !== "__actions" && col.headerName)
            .map((col) => col.field);
        
        const headers = columns
            .filter((col) => col.field !== "__actions" && col.headerName)
            .map((col) => col.headerName);

        const csvRows = [headers.join(",")];

        filteredRows.forEach((row) => {
            const values = activeFields.map((field) => {
                const val = row[field];
                // Strip HTML or newlines and escape double quotes
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

    // Custom loading skeletons to display during loading
    const LoadingSkeleton = () => (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, height: "100%", width: "100%", boxSizing: "border-box" }}>
            {[1, 2, 3, 4, 5].map((idx) => (
                <Skeleton 
                    key={idx} 
                    variant="rounded" 
                    width="100%" 
                    height={48} 
                    animation="wave"
                    sx={{ bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)" }}
                />
            ))}
        </Box>
    );

    return (
        <Paper 
            elevation={1} 
            sx={{ 
                width: "100%", 
                height: 480, 
                display: "flex", 
                flexDirection: "column", 
                borderRadius: 3, 
                overflow: "hidden" 
            }}
        >
            <SearchToolbar
                searchText={searchText}
                onSearchChange={setSearchText}
                placeholder={placeholder}
                onExport={handleCSVExport}
            />
            <Box sx={{ flexGrow: 1, width: "100%" }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    loading={loading}
                    onRowClick={onRowClick}
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 5, page: 0 }
                        }
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    disableRowSelectionOnClick
                    slots={{
                        loadingOverlay: LoadingSkeleton
                    }}
                    sx={{
                        border: "none",
                        "& .MuiDataGrid-cell": {
                            display: "flex",
                            alignItems: "center",
                            fontSize: "0.875rem",
                        },
                        "& .MuiDataGrid-row:hover": {
                            backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(99, 102, 241, 0.05)" : "rgba(79, 70, 229, 0.03)",
                            cursor: onRowClick ? "pointer" : "default"
                        },
                        "& .MuiDataGrid-columnHeaders": {
                            backgroundColor: (theme) => theme.palette.mode === "dark" ? "#1f2937" : "#f1f5f9"
                        },
                        "& .MuiDataGrid-footerContainer": {
                            borderTop: "1px solid",
                            borderColor: "divider"
                        }
                    }}
                    {...props}
                />
            </Box>
        </Paper>
    );
}

export default AppDataGrid;
