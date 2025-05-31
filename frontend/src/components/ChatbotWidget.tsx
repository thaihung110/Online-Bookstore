import React, { useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";

const OPENAI_DEMO_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_DEMO_KEY = "sk-demo"; // <-- Thay bằng key thật nếu cần, demo sẽ không gửi thật

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [{ role: "assistant", content: "Xin chào! Tôi có thể giúp gì cho bạn?" }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      // Gửi request demo tới OpenAI (chỉ hoạt động với key thật)
      const res = await fetch(OPENAI_DEMO_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_DEMO_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: 100,
        }),
      });
      if (!res.ok) throw new Error("Không thể kết nối OpenAI API");
      const data = await res.json();
      const aiMsg =
        data.choices?.[0]?.message?.content || "(Không có phản hồi)";
      setMessages([...newMessages, { role: "assistant", content: aiMsg }]);
    } catch (e: any) {
      setError("Lỗi khi gửi tới AI. (Demo: cần API key thật)");
      setMessages([
        ...newMessages,
        { role: "assistant", content: "(Lỗi: không thể trả lời)" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {!open && (
        <IconButton
          color="primary"
          sx={{ bgcolor: "white", boxShadow: 3, width: 56, height: 56 }}
          onClick={() => setOpen(true)}
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      )}
      {open && (
        <Paper
          elevation={8}
          sx={{
            width: { xs: 320, sm: 360 },
            height: 420,
            display: "flex",
            flexDirection: "column",
            p: 0,
            borderRadius: 3,
            boxShadow: 6,
            mb: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "primary.main",
              color: "white",
              px: 2,
              py: 1,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          >
            <Typography fontWeight={600}>AI Chatbot</Typography>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2,
              py: 1,
              bgcolor: "#f9f9f9",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  bgcolor: msg.role === "user" ? "primary.light" : "grey.200",
                  color: msg.role === "user" ? "white" : "black",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: "80%",
                  fontSize: 15,
                  boxShadow: 1,
                }}
              >
                {msg.content}
              </Box>
            ))}
            {loading && (
              <CircularProgress size={20} sx={{ alignSelf: "center", my: 1 }} />
            )}
            {error && (
              <Typography color="error" fontSize={13} sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", p: 1, borderTop: "1px solid #eee" }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleSend();
              }}
              disabled={loading}
              sx={{ mr: 1, bgcolor: "white" }}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={loading || !input.trim()}
              onClick={handleSend}
              sx={{ minWidth: 0, px: 2 }}
            >
              Gửi
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ChatbotWidget;
