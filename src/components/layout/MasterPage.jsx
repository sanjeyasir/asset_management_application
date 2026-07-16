import { Box, Grid, Divider, Paper } from "@mui/material";
import PageHeader from "../common/PageHeader";

/**
 * MasterPage - Dual-pane layout used across all master modules.
 * Left side: DataGrid with search/export
 * Right side: Entry form (create / edit)
 */
function MasterPage({ title, subtitle, breadcrumbs, action, gridPanel, formPanel }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} action={action} />
            
            {/* Top: Entry Form */}
            <Paper
                elevation={1}
                sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    width: "100%"
                }}
            >
                {formPanel}
            </Paper>

            {/* Bottom: Data Grid */}
            <Box sx={{ width: "100%" }}>
                {gridPanel}
            </Box>
        </Box>
    );
}

export default MasterPage;
