import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/adminStyles";

export default function UserList({ users, onDelete }) {
  return (
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
                onPress={() => onDelete(u._id, u.username)}
              >
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
