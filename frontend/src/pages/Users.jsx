import React, { useEffect, useState } from "react";
import { X, Plus, User, Mail, Shield, Building } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/auth/get-users");
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setFormLoading(true);

    try {
      const res = await api.post("/api/auth/user-register", formData);

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        password: "",
      });
      setIsModalOpen(false);

      // Refresh users list
      await getUsers();
    toast.success("User registered successfully");
    } catch (error) {
      console.error("Error registering user:", error);
      toast.error(error.response?.data?.message || "Failed to register user");
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      email: "",
      password: "",
    });
  };

  useEffect(() => {
    getUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400">
                Add your first user to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User size={20} className="text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add New User
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? "Adding..." : "Add User"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
