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
import api from "../api/axios";
import DOMPurify from "dompurify";
import { marked } from "marked";

const CHATBOT_ENDPOINT = "http://127.0.0.1:8000/chat";

function renderMarkdown(md: string): string {
  // marked có thể trả về Promise nếu dùng async, nên ép về string
  if (typeof marked === "function") {
    const html = marked(md);
    if (typeof html === "string") return html;
    // Nếu là Promise (trường hợp hiếm), trả về chuỗi gốc
    return md;
  }
  return md;
}

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
      const res = await api.post(
        CHATBOT_ENDPOINT,
        { message: input },
        { timeout: 30000 }
      );
      const aiMsg = res.data?.response || "(Không có phản hồi)";
      setMessages([...newMessages, { role: "assistant", content: aiMsg }]);
    } catch (e: any) {
      // Xử lý lỗi đặc biệt
      let userMsg = "Lỗi không xác định khi kết nối chatbot.";
      if (e.response) {
        switch (e.response.status) {
          case 401:
            userMsg = "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
            break;
          case 403:
            userMsg = "Bạn không có quyền truy cập chức năng này.";
            break;
          case 404:
            userMsg = "Không tìm thấy endpoint chatbot.";
            break;
          case 422:
            userMsg =
              e.response.data?.message || "Dữ liệu gửi lên không hợp lệ.";
            break;
          case 500:
            userMsg = "Lỗi server nội bộ. Vui lòng thử lại sau.";
            break;
          default:
            userMsg = e.response.data?.message || `Lỗi: ${e.response.status}`;
        }
      } else if (e.code === "ECONNABORTED") {
        userMsg = "Kết nối tới chatbot bị timeout.";
      } else if (e.message?.includes("Network Error")) {
        userMsg = "Không thể kết nối tới server chatbot.";
      }
      setError(userMsg);
      setMessages([
        ...newMessages,
        { role: "assistant", content: `(Lỗi: ${userMsg})` },
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
                {msg.role === "assistant" ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        renderMarkdown(msg.content || "")
                      ),
                    }}
                  />
                ) : (
                  msg.content
                )}
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
