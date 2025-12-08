import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert 
} from "react-native";
import axios from "axios";

const ENDPOINT = "http://10.20.174.184:5000";

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
      const res = await axios.get(`${ENDPOINT}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Lỗi fetch users:", err.response || err.message);
      alert("Không lấy được danh sách user");
    }
  };

  const createUser = async () => {
    if (!newAccount.username || !newAccount.password) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      await axios.post(`${ENDPOINT}/api/auth/register`, newAccount, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Tạo tài khoản thành công!");
      setNewAccount({ username: "", password: "" });
      fetchUsers();
    } catch (err) {
      console.error(err.response || err.message);
      alert("Lỗi tạo tài khoản");
    }
  };

  const deleteUser = (userId, username) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa user "${username}"?`,
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: async () => {
          try {
            await axios.delete(`${ENDPOINT}/api/auth/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Đã xóa user "${username}"`);
            fetchUsers();
          } catch (err) {
            console.error(err.response || err.message);
            alert("Xóa user thất bại");
          }
        }}
      ]
    );
  };

  useEffect(() => {
    if(token) fetchUsers();
  }, [token]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header với gradient effect */}
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
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>⎋ Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Thêm user */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>👤</Text>
            </View>
            <Text style={styles.cardTitle}>Thêm User Mới</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tên đăng nhập</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập username"
              placeholderTextColor="#999"
              value={newAccount.username}
              onChangeText={t => setNewAccount({ ...newAccount, username: t })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập password"
              placeholderTextColor="#999"
              secureTextEntry
              value={newAccount.password}
              onChangeText={t => setNewAccount({ ...newAccount, password: t })}
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={createUser}>
            <Text style={styles.primaryBtnText}>✓ Tạo User</Text>
          </TouchableOpacity>
        </View>

        {/* Card Danh sách user */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>Danh sách User</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{users.length}</Text>
            </View>
          </View>

          {users.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Chưa có user nào</Text>
              <Text style={styles.emptySubtext}>Thêm user đầu tiên của bạn</Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {users.map(u => (
                <View key={u._id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {u.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{u.username}</Text>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleText}>{u.role}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteBtn} 
                    onPress={() => deleteUser(u._id, u.username)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  container: { 
    padding: 20,
    paddingBottom: 40
  },
  
  // Header Styles
  header: { 
    backgroundColor: '#FF6B35',
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 28,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  logoutBtn: { 
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 13,
  },

  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: { 
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E8EAED',
    color: '#1A1A1A',
  },

  // Button Styles
  primaryBtn: { 
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { 
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },

  // User List Styles
  userList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userName: { 
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  deleteBtn: { 
    backgroundColor: '#FFEBEE',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteBtnText: { 
    fontSize: 18,
  },
});