import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import io from 'socket.io-client';

const ENDPOINT = "http://192.168.0.102:5000";
const { width } = Dimensions.get('window');

export default function App() {
  const [data, setData] = useState({});
  const [history, setHistory] = useState([]);
  const [thresholds, setThresholds] = useState({ temperature: 50, mq2: 300 });

  useEffect(() => {
    const socket = io(ENDPOINT);
    socket.on('sensorUpdate', (newData) => setData(newData));
    fetchHistory();
    return () => socket.disconnect();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${ENDPOINT}/api/history`);
      setHistory(res.data);
    } catch (error) {
      console.log("Lỗi fetch history:", error);
    }
  };

  const sendControl = async (command, value) => {
    try {
      await axios.post(`${ENDPOINT}/api/control`, { command, value });
    } catch (error) {
      alert("Lỗi gửi lệnh điều khiển!");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={data.alarm ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔥 Hệ thống Báo cháy</Text>
          <Text style={styles.headerSubtitle}>Giám sát và điều khiển thông minh</Text>
        </View>

        {/* Status Card */}
        <View style={[
          styles.statusCard,
          { backgroundColor: data.alarm ? '#FF3B30' : '#34C759', shadowColor: data.alarm ? '#FF3B30' : '#34C759' }
        ]}>
          <Text style={styles.statusIcon}>{data.alarm ? '🔥' : '✅'}</Text>
          <Text style={styles.statusText}>{data.alarm ? 'CẢNH BÁO KHẨN CẤP' : 'Hệ thống An toàn'}</Text>
          {data.alarm && <Text style={styles.statusSubtext}>Phát hiện nguy hiểm!</Text>}
        </View>

        {/* Sensor Cards */}
        <View style={styles.sensorGrid}>
          <View style={[styles.sensorCard, styles.temperatureCard]}>
            <Text style={styles.sensorIcon}>🌡️</Text>
            <Text style={styles.sensorValue}>{data.temperature ? data.temperature.toFixed(1) : '0'}°C</Text>
            <Text style={styles.sensorLabel}>Nhiệt độ</Text>
          </View>

          <View style={[styles.sensorCard, styles.gasCard]}>
            <Text style={styles.sensorIcon}>💨</Text>
            <Text style={styles.sensorValue}>{data.mq2Value || '0'}</Text>
            <Text style={styles.sensorLabel}>Khói/Gas</Text>
          </View>

          <View style={[styles.sensorCard, styles.flameCard]}>
            <Text style={styles.sensorIcon}>🔥</Text>
            <Text style={styles.sensorValue}>{data.flameDetected ? 'CÓ' : 'KHÔNG'}</Text>
            <Text style={styles.sensorLabel}>Phát hiện lửa</Text>
          </View>
        </View>

        {/* Threshold Sliders */}
        <View style={styles.thresholdSection}>
          <Text style={styles.sectionTitle}>Ngưỡng cảnh báo</Text>

          {/* Temperature Slider */}
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Nhiệt độ: {thresholds.temperature}°C</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor="#FF9500"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#FF3B30"
              value={thresholds.temperature}
              onValueChange={value => {
                setThresholds(prev => ({ ...prev, temperature: value }));
                sendControl('setTemperatureThreshold', value);
              }}
            />
          </View>

          {/* MQ2 Slider */}
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>MQ2: {thresholds.mq2}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={3000}
              step={10}
              minimumTrackTintColor="#FF9500"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#FF3B30"
              value={thresholds.mq2}
              onValueChange={value => {
                setThresholds(prev => ({ ...prev, mq2: value }));
                sendControl('setMq2Threshold', value);
              }}
            />
          </View>
        </View>

        {/* Control Section */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Điều khiển</Text>
          <TouchableOpacity
            onPress={() => sendControl('setAlarmEnabled', !data.alarmEnabled)}
            style={[styles.controlButton, data.alarmEnabled ? styles.buttonDanger : styles.buttonSuccess]}
            activeOpacity={0.8}
          >
            <Text style={styles.controlIcon}>{data.alarmEnabled ? '🔴' : '🟢'}</Text>
            <Text style={styles.controlButtonText}>
              {data.alarmEnabled ? 'Tắt hệ thống cảnh báo' : 'Bật hệ thống cảnh báo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Lịch sử gần nhất</Text>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyHeaderCell, { flex: 1.2 }]}>Thời gian</Text>
              <Text style={[styles.historyHeaderCell, { flex: 0.8 }]}>Nhiệt độ</Text>
              <Text style={[styles.historyHeaderCell, { flex: 0.7 }]}>MQ2</Text>
              <Text style={[styles.historyHeaderCell, { flex: 0.8 }]}>Trạng thái</Text>
            </View>
            {history.slice(0, 10).map((item, index) => (
              <View key={index} style={[styles.historyRow, { backgroundColor: item.alarm ? '#FFE5E5' : 'white' }]}>
                <Text style={[styles.historyCell, { flex: 1.2 }]}>
                  {new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={[styles.historyCell, { flex: 0.8 }]}>{item.temperature.toFixed(1)}°</Text>
                <Text style={[styles.historyCell, { flex: 0.7 }]}>{item.mq2Value}</Text>
                <Text style={[styles.historyCell, { flex: 0.8, fontWeight: item.alarm ? '600' : '400' }]}>
                  {item.alarm ? '🔥 Cháy' : '✓ OK'}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24, marginTop: 8 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#8E8E93' },
  statusCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  statusIcon: { fontSize: 56, marginBottom: 12 },
  statusText: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  statusSubtext: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  sensorGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  sensorCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  sensorIcon: { fontSize: 32, marginBottom: 8 },
  sensorValue: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  sensorLabel: { fontSize: 12, color: '#8E8E93', textAlign: 'center' },
  thresholdSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  sliderContainer: { marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sliderLabel: { fontSize: 14, color: '#1C1C1E', fontWeight: '500', marginBottom: 4 },
  slider: { width: '100%', height: 40 },
  controlSection: { marginBottom: 24 },
  controlButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonSuccess: { backgroundColor: '#34C759' },
  buttonDanger: { backgroundColor: '#FF3B30' },
  controlIcon: { fontSize: 20, marginRight: 10 },
  controlButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  historySection: { marginBottom: 20 },
  historyCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  historyHeader: { flexDirection: 'row', backgroundColor: '#F2F2F7', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  historyHeaderCell: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textAlign: 'center' },
  historyRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  historyCell: { fontSize: 14, color: '#000', textAlign: 'center' }
});
