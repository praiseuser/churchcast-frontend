import { useNavigate } from "react-router-dom";
import { Box, Typography, Divider, Stack } from "@mui/material";
import StatusBadge from "../../components/StatusBadge";

const stats = [
  { label: "Total Recordings", value: "128" },
  { label: "Media Team", value: "4" },
  { label: "Storage Used", value: "82%" },
  { label: "Services This Month", value: "6" },
];

const recentRecordings = [
  {
    title: "Sunday Service",
    date: "Aug 23",
    duration: "1h 32m",
    status: "completed",
  },
  {
    title: "Wednesday Bible Study",
    date: "Aug 19",
    duration: "1h 05m",
    status: "completed",
  },
  {
    title: "Sunday Service",
    date: "Aug 16",
    duration: "1h 41m",
    status: "editing",
  },
  {
    title: "Praise & Worship Night",
    date: "Aug 12",
    duration: "58m",
    status: "completed",
  },
];

const teamActivity = [
  { text: "David uploaded the Sunday Service recording", time: "2h ago" },
  { text: "Grace finished editing Wednesday Bible Study", time: "Yesterday" },
  {
    text: "Samuel started recording Praise & Worship Night",
    time: "3 days ago",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const storagePct = 82;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Newsreader", serif' }}>
          Good afternoon, Grace Chapel
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sunday, August 30, 2026
        </Typography>
      </Box>

      {/* Stat strip */}
      <Box
        sx={{
          display: "flex",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          mb: 6,
          flexWrap: "wrap",
        }}
      >
        {stats.map((stat, i) => {
          const isStorage = stat.label === "Storage Used";
          return (
            <Box
              key={stat.label}
              sx={{
                flex: "1 1 200px",
                py: 3.5,
                px: 3,
                borderRight:
                  i < stats.length - 1 ? { md: "1px solid" } : "none",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  fontSize: 11,
                  color: "text.secondary",
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Newsreader", serif',
                  fontStyle: "italic",
                  fontSize: 40,
                  lineHeight: 1.15,
                  color: "primary.main",
                  mt: 0.5,
                }}
              >
                {stat.value}
              </Typography>

              {isStorage && (
                <Box
                  sx={{
                    mt: 1.6,
                    height: 3,
                    borderRadius: 4,
                    bgcolor: "divider",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${storagePct}%`,
                      height: "100%",
                      bgcolor: "secondary.main",
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {/* Recent Recordings */}
        <Box sx={{ flex: 2, minWidth: 320 }}>
          <Stack direction="row" alignItems="baseline" spacing={2} mb={2}>
            <Typography variant="h6" sx={{ fontFamily: '"Newsreader", serif' }}>
              Recent Recordings
            </Typography>
            <Typography
              component="button"
              onClick={() => navigate("/admin/recording-history")}
              variant="body2"
              sx={{
                border: "none",
                background: "none",
                p: 0,
                color: "secondary.dark",
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              View all
            </Typography>
          </Stack>

          <Box
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {recentRecordings.map((rec, i) => (
              <Box key={rec.title + i}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 2.2,
                    borderLeft: "2px solid transparent",
                    transition:
                      "border-color 200ms ease, background-color 200ms ease",
                    "&:hover": {
                      borderColor: "secondary.main",
                      bgcolor: "rgba(226,163,62,0.04)",
                    },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {rec.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        letterSpacing: 0.3,
                      }}
                    >
                      {rec.date} · {rec.duration}
                    </Typography>
                  </Box>
                  <StatusBadge status={rec.status} />
                </Box>
                {i < recentRecordings.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Team Activity — connected timeline */}
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Newsreader", serif', mb: 3 }}
          >
            Team Activity
          </Typography>

          <Stack spacing={0}>
            {teamActivity.map((item, i) => {
              const isLast = i === teamActivity.length - 1;
              return (
                <Stack key={i} direction="row" spacing={2}>
                  <Stack alignItems="center" sx={{ width: 8 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        mt: "6px",
                        flexShrink: 0,
                        borderRadius: "50%",
                        bgcolor: i === 0 ? "secondary.main" : "transparent",
                        border: i === 0 ? "none" : "1px solid",
                        borderColor: "divider",
                      }}
                    />
                    {!isLast && (
                      <Box
                        sx={{
                          width: "1px",
                          flex: 1,
                          my: 0.5,
                          bgcolor: "divider",
                        }}
                      />
                    )}
                  </Stack>
                  <Box sx={{ pb: isLast ? 0 : 3 }}>
                    <Typography variant="body2">{item.text}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.time}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}