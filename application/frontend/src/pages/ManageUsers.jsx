import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, Trash2, Save, X, Users } from "lucide-react";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const { user, token, fetchUsers, updateUser, deleteUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "" });

  useEffect(() => {
    if (user?.role !== "admin") return;
    const loadUsers = async () => {
      const res = await fetchUsers();
      if (res?.users) setUsers(res.users);
      else toast.error("Failed to fetch users");
    };
    loadUsers();
  }, [user]);

  if (user?.role !== "admin") {
    return <div className="text-center mt-10">Access denied. Only admins can manage users.</div>;
  }

  const handleEditClick = (u) => {
    setEditingUserId(u.id);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (id) => {
    const res = await updateUser(id, form);
    if (res?.user) {
      toast.success("User updated");
      setEditingUserId(null);
      setUsers(users.map(u => (u.id === id ? res.user : u)));
    } else {
      toast.error(res?.message || "Failed to update user");
    }
  };

  const handleCancel = () => setEditingUserId(null);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await deleteUser(id);
    if (res?.success) {
      toast.success("User deleted");
      setUsers(users.filter(u => u.id !== id));
    } else {
      toast.error(res?.message || "Failed to delete user");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
        <Users className="h-8 w-8 text-blue-600" /> Manage Users
      </h1>

      <table className="w-full table-auto border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Username</th>
            <th className="px-4 py-2 border">Full Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Role</th>
            <th className="px-4 py-2 border">Employee ID</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="text-center border-b border-gray-200">
              <td className="px-2 py-1">{u.username}</td>

              <td className="px-2 py-1">
                {editingUserId === u.id ? (
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="border px-1 py-1 rounded w-20"
                    placeholder="First Name"
                  />
                ) : (
                  u.fullName
                )}
              </td>

              <td className="px-2 py-1">
                {editingUserId === u.id ? (
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="border px-1 py-1 rounded w-32"
                  />
                ) : (
                  u.email
                )}
              </td>

              <td className="px-2 py-1">
                {editingUserId === u.id ? (
                  <select name="role" value={form.role} onChange={handleChange} className="border px-1 py-1 rounded">
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                ) : (
                  u.role
                )}
              </td>

              <td className="px-2 py-1">{u.employeeId}</td>

              <td className="px-2 py-1 flex justify-center gap-1">
                {editingUserId === u.id ? (
                  <>
                    <button
                      onClick={() => handleSave(u.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      <X className="h-4 w-4 inline" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(u)}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;
