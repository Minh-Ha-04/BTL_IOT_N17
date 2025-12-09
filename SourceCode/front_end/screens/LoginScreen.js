import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform,ScrollView } from 'react-native';
import { loginApi } from '../api/authApi';
import { loginStyles as styles } from '../styles/loginStyles';

export default function LoginScreen({ setIsLogin, setRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi(username, password);

      if (res.data && res.data.user) {
        global.token = res.data.token;
        setRole(res.data.user.role);
        setIsLogin(true);
      }
    } catch (err) {
      Alert.alert("Đăng nhập thất bại", err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />

      <View style={styles.topBackground}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔥</Text>
          </View>
          <Text style={styles.title}>Fire Alert System</Text>
          <Text style={styles.subtitle}>Hệ thống cảnh báo cháy thông minh</Text>
        </View>

        {/* Login Card */}
        <View style={styles.loginCard}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardSubtitle}>Vui lòng nhập thông tin tài khoản</Text>

          {/* Username */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Text style={styles.inputIcon}>👤</Text>
            </View>

            <TextInput
              placeholder="Tên đăng nhập"
              placeholderTextColor="#999"
              style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedInput('username')}
              onBlur={() => setFocusedInput('')}
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
            </View>

            <TextInput
              placeholder="Mật khẩu"
              placeholderTextColor="#999"
              style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput('')}
            />
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "⏳ Đang đăng nhập..." : "🚀 Đăng nhập"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.divider} />
            <Text style={styles.footerText}>🔐 Đăng nhập an toàn & bảo mật</Text>
          </View>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}
