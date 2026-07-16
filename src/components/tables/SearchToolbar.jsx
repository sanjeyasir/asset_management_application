import { Box, TextField, InputAdornment, Button } from "@mui/material";
import { Search, Download, ViewColumn, ClearAll } from "@mui/icons-material";

export function SearchToolbar({
    searchText,
    onSearchChange,
    onExport,
    placeholder = "Quick Search...",
    columnsButton = true,
    onColumnsClick,
    onClearFilters,
    ...props
}) {
    return (
        <Box 
            display="flex" 
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between" 
            alignItems={{ xs: "stretch", md: "center" }}
            gap={2} 
            sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
            {...props}
        >
            <TextField
                size="small"
                variant="outlined"
                placeholder={placeholder}
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search fontSize="small" sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                    ),
                    sx: { borderRadius: 2, maxWidth: { xs: "100%", md: 320 } }
                }}
            />
            <Box display="flex" gap={1.5} flexWrap="wrap">
                {onClearFilters && (
                    <Button 
                        size="small" 
                        variant="text" 
                        color="inherit" 
                        startIcon={<ClearAll />}
                        onClick={onClearFilters}
                    >
                        Clear Filters
                    </Button>
                )}
                {columnsButton && onColumnsClick && (
                    <Button 
                        size="small" 
                        variant="outlined" 
                        color="inherit" 
                        startIcon={<ViewColumn />}
                        onClick={onColumnsClick}
                    >
                        Columns
                    </Button>
                )}
                {onExport && (
                    <Button 
                        size="small" 
                        variant="contained" 
                        color="secondary" 
                        startIcon={<Download />}
                        onClick={onExport}
                    >
                        Export CSV
                    </Button>
                )}
            </Box>
        </Box>
    );
}

export default SearchToolbar;
