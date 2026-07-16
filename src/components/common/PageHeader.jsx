import { Box, Typography, Breadcrumbs, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ChevronRight } from "@mui/icons-material";

export function PageHeader({
    title,
    subtitle,
    breadcrumbs = [], // Array of { label, path }
    action,
    ...props
}) {
    return (
        <Box 
            display="flex" 
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between" 
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={2}
            mb={4}
            {...props}
        >
            <Box>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <Breadcrumbs 
                        separator={<ChevronRight fontSize="small" />} 
                        aria-label="breadcrumb"
                        sx={{ mb: 1, "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}
                    >
                        <MuiLink 
                            component={RouterLink} 
                            to="/dashboard" 
                            color="inherit" 
                            underline="hover"
                            sx={{ fontSize: "0.8rem", fontWeight: 500 }}
                        >
                            Console
                        </MuiLink>
                        {breadcrumbs.map((crumb, idx) => {
                            const isLast = idx === breadcrumbs.length - 1;
                            return isLast ? (
                                <Typography 
                                    key={crumb.label} 
                                    color="text.primary" 
                                    sx={{ fontSize: "0.8rem", fontWeight: 600 }}
                                >
                                    {crumb.label}
                                </Typography>
                            ) : (
                                <MuiLink
                                    key={crumb.label}
                                    component={RouterLink}
                                    to={crumb.path}
                                    color="inherit"
                                    underline="hover"
                                    sx={{ fontSize: "0.8rem", fontWeight: 500 }}
                                >
                                    {crumb.label}
                                </MuiLink>
                            );
                        })}
                    </Breadcrumbs>
                )}
                <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px" color="text.primary">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            {action && (
                <Box display="flex" gap={1.5} alignItems="center" alignSelf={{ xs: "stretch", sm: "auto" }} justifyContent={{ xs: "flex-end", sm: "flex-start" }}>
                    {action}
                </Box>
            )}
        </Box>
    );
}

export default PageHeader;
