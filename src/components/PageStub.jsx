import { Box, Typography, Paper } from "@mui/material";

export default function PageStub({ title, description }) {
    return (
        <Box>
            <Typography variant="h4" color="primary.main" gutterBottom>
                {title}
            </Typography>
            <Paper
                variant="outlined"
                sx={{
                    p: 4,
                    mt: 2,
                    borderStyle: "dashed",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    {description || "This page is scaffolded and ready to be built out."}
                </Typography>
            </Paper>
        </Box>
    );
}