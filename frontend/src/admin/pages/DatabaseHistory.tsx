import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import HistoryList, { HistoryEntry } from '../components/books/HistoryList';
import { getHistory } from '../api/bookApi'; // Adjust the import path as necessary

const BookHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

// Fetch history data when component mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading history data...');
        const historyData = await getHistory();
        
        console.log('History data received:', historyData);
        setHistory(historyData);
        
      } catch (error) {
        console.error('Failed to load history:', error);
        setError(error instanceof Error ? error.message : 'Failed to load history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);


  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Book History
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Track all changes made to books in the system, including creation, updates, deletions, and views.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <HistoryList
        history={history}
        loading={loading}
      />
    </Box>
  );
};

export default BookHistoryPage;