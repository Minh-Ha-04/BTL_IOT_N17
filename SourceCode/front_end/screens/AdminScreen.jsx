import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, SafeAreaView, StatusBar, Alert } from "react-native";
import styles from "../styles/adminStyles";

import CreateUserForm from "../components/CreateUserForm";
import UserList from "../components/UserList";

import { getUsers, createUserAPI, deleteUserAPI } from "../services/userService";

export default function AdminScreen({ setIsLogin, setRole }) {
  const [token, setToken] = useState(global.token);
  const [newAccount, setNewAccount] = useState({ username: "", password: "" });
  const [users, setUsers] = useState([]);

  const handleLogout = () => {
    global.token = null;
    setToken(null);
    setRole(null);
    setIsLogin(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers(token);
      setUsers(res.data);
    } catch (err) {
      alert("Không lấy được danh sách user");
    }
  };

  const createUser = async () => {
    if (!newAccount.username || !newAccount.password) return alert("Nhập đủ thông tin");

    try {
      await createUserAPI(token, newAccount);
      alert("Tạo tài khoản thành công!");
      setNewAccount({ username: "", password: "" });
      fetchUsers();
    } catch {
      alert("Lỗi tạo tài khoản");
    }
  };

  const deleteUser = (id, username) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa "${username}"?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: async () => {
            try {
              await deleteUserAPI(token, id);
              alert("Đã xóa");
              fetchUsers();
            } catch {
              alert("Lỗi xóa user");
            }
          }
        }
      ]
    );
  };

  useEffect(() => { if (token) fetchUsers(); }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🔥</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <Text style={styles.headerSubtitle}>Hệ thống Báo cháy</Text>
              </View>
            </View>

            <Text style={styles.logoutText} onPress={handleLogout}>⎋ Đăng xuất</Text>
          </View>
        </View>

        {/* Form tạo user */}
        <CreateUserForm 
          newAccount={newAccount}
          setNewAccount={setNewAccount}
          onCreate={createUser}
        />

        {/* Danh sách user */}
        <UserList users={users} onDelete={deleteUser} />

      </ScrollView>
    </SafeAreaView>
  );
}
