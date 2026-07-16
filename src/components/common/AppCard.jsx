import { Card, CardHeader, CardContent, CardActions, Divider, Typography } from "@mui/material";

export function AppCard({
    children,
    title,
    subheader,
    actions,
    titleTypographyProps,
    headerActions,
    ...props
}) {
    return (
        <Card {...props}>
            {(title || subheader || headerActions) && (
                <>
                    <CardHeader
                        title={title}
                        subheader={subheader}
                        action={headerActions}
                        titleTypographyProps={{
                            variant: "h6",
                            fontWeight: 700,
                            ...titleTypographyProps
                        }}
                        subheaderTypographyProps={{
                            variant: "caption",
                            color: "text.secondary"
                        }}
                        sx={{ px: 3, py: 2 }}
                    />
                    <Divider />
                </>
            )}
            <CardContent sx={{ px: 3, py: 3, "&:last-child": { pb: 3 } }}>
                {children}
            </CardContent>
            {actions && (
                <>
                    <Divider />
                    <CardActions sx={{ px: 3, py: 1.5, justifyContent: "flex-end" }}>
                        {actions}
                    </CardActions>
                </>
            )}
        </Card>
    );
}

export default AppCard;
