// LogoutTab.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './UserScreenStyles';

export default function LogoutTab({ handleLogoutConfirm, setActiveTab }) {
  return (
    <View style={styles.logoutContainer}>
      <View style={styles.logoutCard}>
        <View style={styles.logoutIconContainer}>
          <Text style={styles.logoutIcon}>👋</Text>
        </View>
        <Text style={styles.logoutTitle}>Đăng xuất</Text>
        <Text style={styles.logoutDescription}>
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống giám sát không?
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutConfirm}>
          <Text style={styles.logoutButtonText}>⎋ Đăng xuất ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setActiveTab('system')}
        >
          <Text style={styles.cancelButtonText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoutFooter}>
        <Text style={styles.logoutFooterText}>🛡️ Hệ thống giám sát 24/7</Text>
        <Text style={styles.logoutFooterSubtext}>Fire Alert System v1.0</Text>
      </View>
    </View>
  );
}
