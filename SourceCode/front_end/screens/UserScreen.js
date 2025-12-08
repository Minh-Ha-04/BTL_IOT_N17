import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Dimensions, TouchableOpacity, Modal, Animated, Vibration } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import io from 'socket.io-client';

const ENDPOINT = "http://10.20.174.184:5000";
const { width } = Dimensions.get('window');

export default function UserScreen({ setIsLogin, setRole }) {
  const [data, setData] = useState({
    temperature: 0,
    mq2Value: 0,
    flameValue: 0,
    alarm: 0,
    alarmEnabled: true
  });
  const [thresholds, setThresholds] = useState({ flame: 2000, mq2: 1000 });
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ type: '', message: '', icon: '' });
  const [lastAlarmState, setLastAlarmState] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const socket = io(ENDPOINT);
    socket.on('sensorUpdate', newData => {
      setData(prevData => {
        // Kiểm tra nếu trạng thái alarm thay đổi từ 0 lên 1 hoặc 2
        if (prevData.alarm === 0 && newData.alarm > 0) {
          showAlertNotification(newData.alarm);
        } else if (prevData.alarm === 1 && newData.alarm === 2) {
          showAlertNotification(newData.alarm);
        }
        return newData;
      });
    });
    return () => socket.disconnect();
  }, []);

  // Hiển thị thông báo cảnh báo
  const showAlertNotification = (alarmLevel) => {
    // Rung điện thoại
    Vibration.vibrate([0, 500, 200, 500]);

    if (alarmLevel === 2) {
      setAlertData({
        type: 'fire',
        message: 'PHÁT HIỆN LỬA',
        detail: 'Hệ thống phát hiện ngọn lửa! Vui lòng kiểm tra ngay lập tức!',
        icon: '🔥',
        color: '#FF3B30'
      });
    } else if (alarmLevel === 1) {
      setAlertData({
        type: 'smoke',
        message: 'CẢNH BÁO KHÓI/GAS',
        detail: 'Phát hiện nồng độ khói/gas vượt ngưỡng an toàn!',
        icon: '💨',
        color: '#FF9500'
      });
    }

    setShowAlert(true);
    startPulseAnimation();
  };

  // Animation nhấp nháy
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const closeAlert = () => {
    setShowAlert(false);
    pulseAnim.setValue(1);
  };

  const sendControl = async (command, value) => {
    try {
      await axios.post(`${ENDPOINT}/api/control`, { command, value });
    } catch (error) {
      console.error("Lỗi gửi lệnh điều khiển:", error);
      alert("Lỗi gửi lệnh điều khiển!");
    }
  };

  const handleLogout = () => {
    global.token = null;
    setRole(null);
    setIsLogin(false);
  };

  const getAlarmStatus = () => {
    if (data.alarm === 2) return { text: 'PHÁT HIỆN LỬA', color: '#FF3B30', icon: '🔥', gradient: ['#FF3B30', '#FF6B6B'] };
    if (data.alarm === 1) return { text: 'CẢNH BÁO KHÓI/GAS', color: '#FF9500', icon: '💨', gradient: ['#FF9500', '#FFB84D'] };
    return { text: 'Hệ thống An toàn', color: '#34C759', icon: '✅', gradient: ['#34C759', '#5FD97A'] };
  };

  const alarmStatus = getAlarmStatus();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={alarmStatus.color} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: alarmStatus.color }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconCircle}>
                <Text style={styles.headerIcon}>🔥</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Fire Alert System</Text>
                <Text style={styles.headerSubtitle}>Giám sát & Điều khiển</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>⎋ Thoát</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card - Animated Alert */}
        <View style={[styles.statusCard, { backgroundColor: alarmStatus.color }]}>
          <View style={styles.statusIconContainer}>
            <Text style={styles.statusIcon}>{alarmStatus.icon}</Text>
          </View>
          <Text style={styles.statusText}>{alarmStatus.text}</Text>
          {!data.alarmEnabled && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>⚠️ Cảnh báo đã TẮT</Text>
            </View>
          )}
        </View>

        {/* Sensor Grid */}
        <View style={styles.sensorGrid}>
          {/* Temperature */}
          <View style={styles.sensorCard}>
            <View style={[styles.sensorIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.sensorCardIcon}>🌡️</Text>
            </View>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorValue}>{data.temperature ? data.temperature.toFixed(1) : '0'}</Text>
              <Text style={styles.sensorUnit}>°C</Text>
            </View>
            <Text style={styles.sensorLabel}>Nhiệt độ</Text>
            <View style={[styles.sensorBar, { width: `${Math.min((data.temperature / 100) * 100, 100)}%`, backgroundColor: '#FF9800' }]} />
          </View>

          {/* MQ2 Gas */}
          <View style={styles.sensorCard}>
            <View style={[styles.sensorIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.sensorCardIcon}>💨</Text>
            </View>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorValue}>{data.mq2Value || '0'}</Text>
              <Text style={styles.sensorUnit}>ppm</Text>
            </View>
            <Text style={styles.sensorLabel}>Khói/Gas</Text>
            <Text style={styles.sensorThreshold}>Ngưỡng: {thresholds.mq2}</Text>
            <View style={[styles.sensorBar, { width: `${Math.min((data.mq2Value / thresholds.mq2) * 100, 100)}%`, backgroundColor: '#4CAF50' }]} />
          </View>

          {/* Flame */}
          <View style={styles.sensorCard}>
            <View style={[styles.sensorIconBg, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.sensorCardIcon}>🔥</Text>
            </View>
            <View style={styles.sensorInfo}>
              <Text style={styles.sensorValue}>{data.flameValue || '0'}</Text>
              <Text style={styles.sensorUnit}>lux</Text>
            </View>
            <Text style={styles.sensorLabel}>Cảm biến lửa</Text>
            <Text style={styles.sensorThreshold}>Ngưỡng: {thresholds.flame}</Text>
            <View style={[styles.sensorBar, { width: `${Math.min((data.flameValue / thresholds.flame) * 100, 100)}%`, backgroundColor: '#F44336' }]} />
          </View>
        </View>

        {/* Threshold Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>⚙️</Text>
            </View>
            <Text style={styles.cardTitle}>Cài đặt ngưỡng cảnh báo</Text>
          </View>

          {/* Flame Threshold Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>🔥 Cảm biến lửa</Text>
              <View style={styles.sliderValueBadge}>
                <Text style={styles.sliderValueText}>{thresholds.flame}</Text>
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={4095}
              step={50}
              minimumTrackTintColor="#FF3B30"
              maximumTrackTintColor="#E8EAED"
              thumbTintColor="#FF3B30"
              value={thresholds.flame}
              onSlidingComplete={v => {
                setThresholds(prev => ({ ...prev, flame: v }));
                sendControl('setFlameThreshold', v);
              }}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.rangeText}>0</Text>
              <Text style={styles.rangeText}>4095</Text>
            </View>
          </View>

          {/* MQ2 Threshold Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>💨 Cảm biến khí gas</Text>
              <View style={styles.sliderValueBadge}>
                <Text style={styles.sliderValueText}>{thresholds.mq2}</Text>
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={4095}
              step={50}
              minimumTrackTintColor="#FF9500"
              maximumTrackTintColor="#E8EAED"
              thumbTintColor="#FF9500"
              value={thresholds.mq2}
              onSlidingComplete={v => {
                setThresholds(prev => ({ ...prev, mq2: v }));
                sendControl('setMq2Threshold', v);
              }}
            />
            <View style={styles.sliderRange}>
              <Text style={styles.rangeText}>0</Text>
              <Text style={styles.rangeText}>4095</Text>
            </View>
          </View>
        </View>

        {/* Control Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>🎮</Text>
            </View>
            <Text style={styles.cardTitle}>Điều khiển hệ thống</Text>
          </View>

          <TouchableOpacity
            onPress={() => sendControl('setAlarmEnabled', !data.alarmEnabled)}
            style={[styles.controlButton, data.alarmEnabled ? styles.buttonDanger : styles.buttonSuccess]}
          >
            <View style={styles.controlButtonContent}>
              <View style={styles.controlIconCircle}>
                <Text style={styles.controlIcon}>{data.alarmEnabled ? '🔴' : '🟢'}</Text>
              </View>
              <View style={styles.controlTextContainer}>
                <Text style={styles.controlButtonText}>
                  {data.alarmEnabled ? 'Tắt cảnh báo' : 'Bật cảnh báo'}
                </Text>
                <Text style={styles.controlButtonSubtext}>
                  {data.alarmEnabled ? 'Hệ thống đang hoạt động' : 'Hệ thống đang tắt'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🛡️ Hệ thống giám sát 24/7</Text>
          <Text style={styles.footerSubtext}>Cập nhật realtime qua WebSocket</Text>
        </View>

      </ScrollView>

      {/* Alert Modal Pop-up */}
      <Modal
        visible={showAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.alertModal,
              { 
                backgroundColor: alertData.color,
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <View style={styles.alertIconContainer}>
              <Text style={styles.alertIcon}>{alertData.icon}</Text>
            </View>
            
            <Text style={styles.alertTitle}>{alertData.message}</Text>
            <Text style={styles.alertDetail}>{alertData.detail}</Text>
            
            <View style={styles.alertInfo}>
              <View style={styles.alertInfoRow}>
                <Text style={styles.alertInfoLabel}>🌡️ Nhiệt độ:</Text>
                <Text style={styles.alertInfoValue}>{data.temperature?.toFixed(1)}°C</Text>
              </View>
              <View style={styles.alertInfoRow}>
                <Text style={styles.alertInfoLabel}>💨 Khói/Gas:</Text>
                <Text style={styles.alertInfoValue}>{data.mq2Value} ppm</Text>
              </View>
              <View style={styles.alertInfoRow}>
                <Text style={styles.alertInfoLabel}>🔥 Lửa:</Text>
                <Text style={styles.alertInfoValue}>{data.flameValue} lux</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.alertButton}
              onPress={closeAlert}
            >
              <Text style={styles.alertButtonText}>✓ ĐÃ HIỂU</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  container: { 
    paddingBottom: 40 
  },
  
  // Header
  header: {
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
  headerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  logoutBtn: { 
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 13,
  },

  // Status Card
  statusCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: { 
    fontSize: 48,
  },
  statusText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  warningBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  warningText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600',
  },

  // Sensor Grid
  sensorGrid: { 
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  sensorCard: { 
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  sensorIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorCardIcon: { 
    fontSize: 24,
  },
  sensorInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  sensorValue: { 
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  sensorUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
    fontWeight: '600',
  },
  sensorLabel: { 
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
  },
  sensorThreshold: { 
    fontSize: 9,
    color: '#C7C7CC',
    textAlign: 'center',
    marginBottom: 8,
  },
  sensorBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
  },

  // Card
  card: {
    marginHorizontal: 20,
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
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },

  // Slider
  sliderContainer: {
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  sliderValueBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  sliderValueText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  slider: { 
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rangeText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },

  // Control Button
  controlButton: {
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSuccess: { 
    backgroundColor: '#34C759',
  },
  buttonDanger: { 
    backgroundColor: '#FF3B30',
  },
  controlButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  controlIcon: { 
    fontSize: 24,
  },
  controlTextContainer: {
    flex: 1,
  },
  controlButtonText: { 
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  controlButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },

  // Footer
  footer: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },

  // Modal Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  alertIcon: {
    fontSize: 56,
  },
  alertTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  alertDetail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertInfo: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  alertInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertInfoLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  alertInfoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  alertButton: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  alertButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});