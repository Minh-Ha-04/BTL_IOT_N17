import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import styles from "../styles/adminStyles";

export default function CreateUserForm({ newAccount, setNewAccount, onCreate }) {
  return (
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
          onChangeText={(t) => setNewAccount({ ...newAccount, username: t })}
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
          onChangeText={(t) => setNewAccount({ ...newAccount, password: t })}
        />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onCreate}>
        <Text style={styles.primaryBtnText}>✓ Tạo User</Text>
      </TouchableOpacity>
    </View>
  );
}
