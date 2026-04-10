// src/pages/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const { login } = useAuth(); // you can auto-login after registration
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'staff', // default role
    department: 'General', // default department
    employeeId: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Registration successful! Logging in...');
        // Optional: auto-login after register
        await login({ email: formData.email, password: formData.password });
        navigate('/dashboard'); // redirect after login
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Register error:', err);
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="employeeId"
          placeholder="Employee ID"
          value={formData.employeeId}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="staff">Staff</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="admin">Admin</option>
        </select>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="General">General</option>
          <option value="ICU">ICU</option>
          <option value="Administration">Administration</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;
