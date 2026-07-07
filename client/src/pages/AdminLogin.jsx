import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { AdminPanelSettings, Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.warn('Please enter credentials');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/admin-login', form);
      login(res.data, res.data.token);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #002f6c 0%, #004aad 50%, #0061d5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3, boxShadow: 10 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo area */}
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #002f6c, #004aad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2
              }}
            >
              <AdminPanelSettings sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
              NSS Report System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin Portal — Sign in to continue
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              id="admin-email"
              label="Admin Email / Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoFocus
            />
            <TextField
              id="admin-password"
              label="Password"
              type={showPass ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(p => !p)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              id="admin-login-btn"
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Lock />}
              sx={{ mt: 2, py: 1.4, fontWeight: 'bold', fontSize: '1rem' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
