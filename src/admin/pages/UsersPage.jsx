import React, { useEffect, useState } from 'react';
import { Trash2, User, Search, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import axios from "axios";
import swal from 'sweetalert';

export default function UserPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  // States for messaging functionality
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState(''); // Subject field
  const [sendingMessage, setSendingMessage] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:4000/api/auth/alluser", {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
        });

        if (response.data?.users) {
          setUsers(response.data.users);
          setFilteredUsers(response.data.users);
        } else {
          console.error("Unexpected response:", response.data);
          setError("Unexpected data format received");
        }
      } catch (error) {
        console.error("API error:", error);
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const initiateDeleteUser = (user) => {
    setUserToDelete(user);
    setShowConfirmDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const id = userToDelete._id;
    const userName = userToDelete.fullName;

    try {
      setDeletingId(id);
      setShowConfirmDialog(false);

      const response = await axios.delete(`http://localhost:4000/api/auth/deleteuser/${id}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
        },
      });

      if (response.status === 200) {
        setUsers(users.filter(user => user._id !== id));

        swal({
          title: "Success!",
          text: `${userName} has been deleted successfully!`,
          icon: "success",
          button: "OK",
          timer: 3000,
        });
      } else {
        console.error("Failed to delete user:", response.data);

        // Show error sweet alert
        swal({
          title: "Error!",
          text: "Failed to delete user. Please try again.",
          icon: "error",
          button: "OK",
        });
      }
    } catch (error) {
      console.log("Error deleting user:", error);

      // Show error sweet alert
      swal({
        title: "Error!",
        text: "An error occurred while deleting the user.",
        icon: "error",
        button: "OK",
      });
    } finally {
      setTimeout(() => setDeletingId(null), 800);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setUserToDelete(null);
  };

  // Function to open message box for a specific user
  const openMessageBox = (user) => {
    setSelectedUser(user);
    setShowMessageBox(true);
    setMessage('');
    setSubject(''); // Reset subject when opening message box
  };

  // Function to close message box
  const closeMessageBox = () => {
    setShowMessageBox(false);
    setSelectedUser(null);
    setMessage('');
    setSubject(''); // Reset subject when closing message box
  };

  // Updated function to send message/email to user
  const sendMessage = async () => {
    if (!selectedUser || !message.trim() || !subject.trim()) return;

    try {
      setSendingMessage(true);

      // Use the new admin email sending endpoint
      const response = await axios.post(
        "http://localhost:4000/api/admin/send-email",
        {
          name: selectedUser.fullName,
          email: selectedUser.email,
          subject: subject,
          message: message
        },
        {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
        }
      );

      if (response.status === 200) {
        // Show success sweet alert
        swal({
          title: "Email Sent!",
          text: `Your message has been sent to ${selectedUser.fullName} successfully!`,
          icon: "success",
          button: "OK",
          timer: 3000,
        });

        closeMessageBox();
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);

      // Show error sweet alert
      swal({
        title: "Error!",
        text: "Failed to send email. Please try again.",
        icon: "error",
        button: "OK",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-2 flex items-center justify-center">
        <div className="text-base">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen p-2 flex items-center justify-center">
        <div className="text-base text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-2 md:p-6 -ml-16 sm:ml-6 md:ml-6 lg:ml-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 md:px-6 md:py-4 border-b border-gray-200 bg-gray-800 text-white">
            <h1 className="text-base md:text-xl font-semibold">User Management</h1>
          </div>

          <div className="p-2 md:p-6">
            {/* Search box */}
            <div className="mb-3 relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search size={14} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                className="pl-7 w-full p-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-2 text-sm">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`
                      flex items-center justify-between border-b border-gray-200 pb-2
                      ${deletingId === user._id ? 'animate-pulse opacity-50 transform scale-0 transition-all duration-700' : ''}
                    `}
                  >
                    {/* User info - Compact layout */}
                    <div className="flex items-center overflow-hidden">
                      <div className="bg-gray-100 p-1.5 rounded-full mr-2">
                        <User size={14} className="text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm truncate">{user.fullName}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>

                    {/* Action buttons - Compact & icon only on smallest screens */}
                    <div className="flex space-x-1 ml-1 shrink-0">
                      {/* Message button */}
                      <button
                        onClick={() => openMessageBox(user)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md transition-colors duration-200 flex items-center"
                        aria-label="Message user"
                      >
                        <MessageSquare size={14} className="sm:mr-1" />
                        <span className="hidden sm:inline text-xs">Message</span>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => initiateDeleteUser(user)}
                        className={`text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors duration-200 flex items-center ${deletingId === user._id ? 'animate-spin' : ''}`}
                        aria-label="Delete user"
                      >
                        <Trash2 size={14} className="sm:mr-1" />
                        <span className="hidden sm:inline text-xs">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog - Compact version */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-3 w-full max-w-xs sm:max-w-sm mx-auto shadow-xl">
            <div className="flex items-center text-red-600 mb-2">
              <AlertTriangle size={16} className="mr-1.5" />
              <h3 className="text-sm font-medium">Confirm Delete</h3>
            </div>

            <p className="mb-3 text-xs sm:text-sm">
              Delete <span className="font-semibold">{userToDelete?.fullName}</span>?
              This cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 size={12} className="mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Box Dialog - Compact version (Now used for sending emails) */}
      {showMessageBox && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-3 w-full max-w-xs sm:max-w-sm mx-auto shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <MessageSquare size={14} className="text-blue-600 mr-1.5" />
                <h3 className="text-sm font-medium truncate max-w-[180px]">
                  To: {selectedUser.email}
                </h3>
              </div>
              <button
                onClick={closeMessageBox}
                className="text-gray-500 hover:text-gray-700 h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-100 text-sm"
              >
                &times;
              </button>
            </div>

            {/* Subject input field */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="Subject"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="mb-2">
              <textarea
                rows="3"
                placeholder="Type your message here..."
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-xs"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                onClick={sendMessage}
                disabled={!message.trim() || !subject.trim() || sendingMessage}
                className={`
                  px-2 py-1 bg-blue-600 text-white rounded text-xs transition-colors flex items-center
                  ${!message.trim() || !subject.trim() || sendingMessage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                `}
              >
                {sendingMessage ? (
                  <div className="animate-spin mr-1 h-2 w-2 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Send size={12} className="mr-1" />
                )}
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}