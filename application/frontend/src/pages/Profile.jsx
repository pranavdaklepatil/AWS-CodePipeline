import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, Edit, Save, X, Calendar, Key, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  // Edit profile form
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });

  // Change password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || ""
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        No user logged in
      </div>
    );
  }

  // Handle profile form input
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Save profile updates
  const handleSaveProfile = async () => {
    const res = await updateProfile(form);
    if (res?.user) {
      toast.success("Profile updated successfully");
      setEditing(false);
    } else {
      toast.error(res?.message || "Failed to update profile");
    }
  };

  // Handle password input
  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  // Save password
  const handleSavePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Both fields are required");
      return;
    }

    const res = await changePassword(passwordForm);
    if (res?.success) {
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setChangingPassword(false);
    } else {
      toast.error(res?.message || "Failed to change password");
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 md:px-6 lg:px-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-800">
            <User className="h-8 w-8 text-blue-600" /> Profile
          </h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>

        {!editing && (
          <div className="flex gap-2">
            {user.role === "admin" && (
              <button
                onClick={() => navigate("/developer/users")}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                <Users className="h-4 w-4" /> Manage Users
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Edit className="h-4 w-4" /> Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-blue-100 text-blue-600 text-2xl font-bold">
                {user.fullName?.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full">
          <h2 className="text-2xl font-semibold text-gray-800">{user.fullName}</h2>
          <p className="text-gray-500 mb-4 capitalize">{user.role}</p>

          {editing ? (
            <div className="space-y-3">
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" /> {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" /> {user.role}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                Employee ID: {user.employeeId || "N/A"}
              </div>
              <div>Department: {user.department || "N/A"}</div>
              <div>
                Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <Key className="h-5 w-5 text-blue-600" /> Change Password
          </h2>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="text-blue-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {changingPassword && (
          <div className="space-y-3">
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current Password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="New Password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSavePassword}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                <Save className="h-4 w-4" /> Save
              </button>
              <button
                onClick={() => setChangingPassword(false)}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
