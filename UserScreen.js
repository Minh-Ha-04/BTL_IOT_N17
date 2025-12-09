import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
  Vibration,
  SafeAreaView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';
import io from 'socket.io-client';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

const ENDPOINT = "http://172.20.10.2:5000";
const { width } = Dimensions.get('window');
const MAX_HISTORY = 20;

// Điểm mốc (tòa nhà / vị trí cháy mặc định) – sửa lại cho đúng
const REF_LAT = 20.981039451695622;
const REF_LON = 105.78747617443048;

// Bán kính nguy hiểm 1km
const DANGER_RADIUS_KM = 1;
const DISTANCE_ALERT_INTERVAL_MS = 60 * 1000; // 1 phút

// ======= Các hàm hỗ trợ toán học / tọa độ =======

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Haversine: khoảng cách km giữa 2 điểm
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Tính hướng (bearing) từ user -> điểm mốc
function calculateBearing(lat1, lon1, lat2, lon2) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const λ1 = toRad(lon1);
  const λ2 = toRad(lon2);
  const dLon = λ2 - λ1;

  const y = Math.sin(dLon) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLon);

  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI; // rad -> deg
  brng = (brng + 360) % 360; // 0–360

  return brng;
}

// Chuyển bearing thành chữ: Bắc / Đông-Bắc / Đông / ...
function bearingToDirection(bearing) {
  const dirs = [
    'Bắc',
    'Đông-Bắc',
    'Đông',
    'Đông-Nam',
    'Nam',
    'Tây-Nam',
    'Tây',
    'Tây-Bắc',
  ];
  const idx = Math.round(bearing / 45) % 8;
  return dirs[idx];
}

export default function UserScreen({ setIsLogin, setRole }) {
  const [activeTab, setActiveTab] = useState('system'); // 'system', 'stats', 'logout'
  const [data, setData] = useState({
    temperature: 0,
    mq2Value: 0,
    flameValue: 0,
    alarm: 0,
    alarmEnabled: true,
  });
  const [thresholds, setThresholds] = useState({ flame: 2000, mq2: 1000 });
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ type: '', message: '', icon: '' });

  const [tempHistory, setTempHistory] = useState([]);
  const [gasHistory, setGasHistory] = useState([]);
  const [flameHistory, setFlameHistory] = useState([]);

  // ====== STATE mới cho định vị & cảnh báo khoảng cách ======
  const [location, setLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null); // { distanceKm, directionText, messageText, updatedAt, latitude, longitude }
  const [lastDistanceAlertTime, setLastDistanceAlertTime] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef(null);

  const sanitize = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const pushHistory = (setter, value) => {
    setter((prev) => {
      const sanitized = sanitize(value);
      const next = [...prev.slice(-(MAX_HISTORY - 1)), sanitized];
      return next;
    });
  };

  const emptyLabels = (arr) => Array(arr.length).fill('');

  // ====== Socket nhận dữ liệu cảm biến (giữ nguyên logic cũ) ======
  useEffect(() => {
    const socket = io(ENDPOINT, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {});

    socket.on("sensorUpdate", (newData) => {
      // đẩy lịch sử
      pushHistory(setTempHistory, newData.temperature);
      pushHistory(setGasHistory, newData.mq2Value);
      pushHistory(setFlameHistory, newData.flameValue);
    
      setData((prevData) => {
        try {
          const alarmType = newData.alarm;
    
          // =============================
          // 🔥🧪 CẢNH BÁO CHÁY / GAS
          // =============================
          if (alarmType === 1) {
            // Khí GAS vượt ngưỡng
            setAlertData({
              type: "GAS",
              message: "Phát hiện khí gas vượt ngưỡng!",
              icon: "⚠️",
            });
    
            playGasSound();
            Speech.speak(
              "Cảnh báo! Nồng độ khí gas vượt ngưỡng an toàn. Vui lòng mở cửa thoáng khí và rời khỏi khu vực nguy hiểm."
            );
    
            setShowAlert(true);
          }
    
          if (alarmType === 2) {
            // LỬA
            setAlertData({
              type: "LỬA",
              message: "Phát hiện lửa! Nguy hiểm!",
              icon: "🔥",
            });
    
            playFireSound();
            Speech.speak(
              "Nguy hiểm! Phát hiện đám cháy! Vui lòng sơ tán ngay lập tức khỏi khu vực. Giữ bình tĩnh và tránh hít phải khói."
            );
    
            setShowAlert(true);
          }
    
          // =============================
          // 📍 CẢNH BÁO KHOẢNG CÁCH & HƯỚNG
          // (Dùng GPS người dùng)
          // =============================
          if (location) {
            const userLat = location.coords.latitude;
            const userLon = location.coords.longitude;
    
            const distanceKm = getDistanceKm(userLat, userLon, REF_LAT, REF_LON);
            const bearing = calculateBearing(userLat, userLon, REF_LAT, REF_LON);
            const directionText = bearingToDirection(bearing);
    
            const now = Date.now();
    
            if (distanceKm <= DANGER_RADIUS_KM) {
              if (now - lastDistanceAlertTime > DISTANCE_ALERT_INTERVAL_MS) {
                Speech.speak(
                  `Chú ý! Bạn đang ở trong vùng nguy hiểm cách điểm cháy khoảng ${distanceKm.toFixed(
                    2
                  )} kilomet khoảng cách tương đối. Hướng thoát an toàn theo hướng ${directionText}.`
                );
    
                setLastDistanceAlertTime(now);
              }
            }
    
            setDistanceInfo({
              distanceKm,
              directionText,
              messageText:
                distanceKm <= DANGER_RADIUS_KM
                  ? "Bạn đang trong vùng nguy hiểm!"
                  : "An toàn",
              updatedAt: new Date(),
              latitude: userLat,
              longitude: userLon,
            });
          }
        } catch (e) {}
    
        // cập nhật dữ liệu mới sau xử lý
        return {
          temperature: sanitize(newData.temperature),
          mq2Value: sanitize(newData.mq2Value),
          flameValue: sanitize(newData.flameValue),
          alarm: Number.isFinite(Number(newData.alarm))
            ? Number(newData.alarm)
            : 0,
          alarmEnabled:
            typeof newData.alarmEnabled === "boolean"
              ? newData.alarmEnabled
              : true,
        };
      });
    });
    
    socket.on('disconnect', () => {});

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // ====== Hàm lấy vị trí & cập nhật distanceInfo ======
  const requestAndUpdateLocation = async () => {
    try {
      // Nếu chưa xin quyền thì xin; nếu xin rồi mà bị từ chối thì thôi
      if (hasLocationPermission === null) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setHasLocationPermission(false);
          return null;
        }
        setHasLocationPermission(true);
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });

      const distanceKm = getDistanceKm(latitude, longitude, REF_LAT, REF_LON);
      const bearing = calculateBearing(latitude, longitude, REF_LAT, REF_LON);
      const directionText = bearingToDirection(bearing);

      const baseInfo = {
        distanceKm,
        directionText,
        latitude,
        longitude,
        updatedAt: Date.now(),
      };

      setDistanceInfo((prev) => ({
        ...(prev || {}),
        ...baseInfo,
      }));

      return baseInfo;
    } catch (e) {
      console.warn('Lỗi lấy vị trí người dùng:', e);
      return null;
    }
  };

 // ====== Hàm cảnh báo khoảng cách (<1km) + giọng nói ======
const triggerDistanceAlertIfNeeded = async (source = 'alarm') => {
  try {
    const now = Date.now();
    // Chống spam: mỗi 1 phút mới cho kêu 1 lần
    if (now - lastDistanceAlertTime < DISTANCE_ALERT_INTERVAL_MS) {
      return;
    }

    // Nếu không có cháy (2) hoặc gas (1) → không cảnh báo
    if (data.alarm !== 1 && data.alarm !== 2) return;

    // Lấy vị trí người dùng
    const info = await requestAndUpdateLocation();
    if (!info) return;

    // Chỉ cảnh báo khi ở gần
    if (info.distanceKm < DANGER_RADIUS_KM) {
      setLastDistanceAlertTime(now);

      const distanceText =
        info.distanceKm < 1
          ? `${Math.round(info.distanceKm * 1000)} mét`
          : `${info.distanceKm.toFixed(2)} km`;

      const directionText = info.directionText || "không xác định";

      // ================================
      // 🔥 Nếu là CHÁY (alarm = 2)
      // ================================
      let messageText = "";
      if (data.alarm === 2) {
        messageText = `Nguy hiểm! Khu vực phía trước đang xảy ra CHÁY. 
          Bạn đang cách điểm cháy khoảng ${distanceText}, hướng ${directionText}. 
          Vui lòng nhanh chóng di chuyển ra khỏi khu vực và làm theo hướng dẫn an toàn.`;
      }

      // ================================
      // ⚠️ Nếu là GAS (alarm = 1)
      // ================================
      if (data.alarm === 1) {
        messageText = `Cảnh báo khí GAS! Bạn đang ở gần khu vực có rò rỉ khí gas,
          cách khoảng ${distanceText}, hướng ${directionText}. 
          Vui lòng tránh xa khu vực, không bật công tắc điện và tìm nơi thông thoáng.`;
      }

      // Lưu message vào state để UI hiển thị
      setDistanceInfo((prev) => ({
        ...(prev || {}),
        ...info,
        messageText,
      }));

      // Giọng nói – tránh chồng lẫn
      Speech.stop();
      Speech.speak(messageText, {
        language: "vi-VN",
        rate: 1.0,
        pitch: 1.0,
      });
    }
  } catch (e) {
    console.warn("Lỗi khi cảnh báo khoảng cách:", e);
  }
};


  // ====== Lặp lại cảnh báo khoảng cách mỗi 1 phút khi đang có cháy ======
  useEffect(() => {
    let intervalId = null;
    if (data.alarm > 0) {
      intervalId = setInterval(() => {
        // chỉ những ai ở gần (<1km) mới nhận được, check trong hàm
        triggerDistanceAlertIfNeeded('interval');
      }, DISTANCE_ALERT_INTERVAL_MS);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [data.alarm]);

  // ====== Cảnh báo cháy/khói – logic cũ, chỉ thêm gọi distanceAlert ======
  const showAlertNotification = (alarmLevel) => {
    Vibration.vibrate([0, 500, 200, 500]);

    if (alarmLevel === 2) {
      setAlertData({
        type: 'fire',
        message: 'PHÁT HIỆN LỬA',
        detail:
          'Hệ thống phát hiện ngọn lửa! Vui lòng kiểm tra ngay lập tức!',
        icon: '🔥',
        color: '#FF3B30',
      });
    } else if (alarmType === 1) {
      setAlertData({
        type: "GAS",
        message: "Phát hiện khí gas vượt ngưỡng!",
        icon: "⚠️",
      });
    
      playGasSound();
    
      // CHẶN TẤT CẢ GIỌNG NÓI KHÁC ĐỂ ƯU TIÊN GAS
      Speech.stop();
    
      setTimeout(() => {
        Speech.speak(
          "Cảnh báo nguy hiểm! Có rò rỉ khí gas. Vui lòng mở cửa thông gió và rời khỏi khu vực ngay lập tức.",
          { language: "vi-VN", rate: 1.0, pitch: 1.0 }
        );
      }, 300); // delay nhỏ cho chắc chắn không bị overlap
      
      setShowAlert(true);
    }

    setShowAlert(true);
    startPulseAnimation();

    // 🔔 Thêm: nếu đang cháy và user ở gần thì xử lý thêm cảnh báo khoảng cách
    triggerDistanceAlertIfNeeded('alarm');
  };

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
      console.error('Lỗi gửi lệnh điều khiển:', error);
      Alert.alert('Lỗi', 'Không thể gửi lệnh điều khiển!');
    }
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: () => {
            global.token = null;
            setRole(null);
            setIsLogin(false);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getAlarmStatus = () => {
    if (data.alarm === 2)
      return { text: 'PHÁT HIỆN LỬA', color: '#FF3B30', icon: '🔥' };
    if (data.alarm === 1)
      return { text: 'CẢNH BÁO KHÓI/GAS', color: '#FF9500', icon: '💨' };
    return { text: 'Hệ thống An toàn', color: '#34C759', icon: '✅' };
  };

  const alarmStatus = getAlarmStatus();

  const safeArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [0];
    return arr.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));
  };

  // ============== RENDER TABS ==============

  const renderSystemTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Card */}
      <View
        style={[styles.statusCard, { backgroundColor: alarmStatus.color }]}
      >
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

      {/* Banner cảnh báo khoảng cách nếu < 1km */}
      {distanceInfo && distanceInfo.distanceKm < DANGER_RADIUS_KM && (
        <View style={styles.distanceBanner}>
          <Text style={styles.distanceBannerTitle}>
            ⚠️ Bạn đang ở rất gần khu vực cháy
          </Text>
          <Text style={styles.distanceBannerText}>
            Khoảng cách:{' '}
            {distanceInfo.distanceKm < 1
              ? `${Math.round(distanceInfo.distanceKm * 1000)} m`
              : `${distanceInfo.distanceKm.toFixed(2)} km`}
            {distanceInfo.directionText
              ? ` · Hướng: ${distanceInfo.directionText}`
              : ''}
          </Text>
          <Text style={styles.distanceBannerSub}>
            Vui lòng nhanh chóng di chuyển theo lối thoát hiểm gần nhất để đến
            nơi an toàn.
          </Text>
        </View>
      )}

      {/* Sensor Grid */}
      <View style={styles.sensorGrid}>
        {/* Temperature Card */}
        <View className="sensorCard" style={styles.sensorCard}>
          <View
            style={[styles.sensorIconBg, { backgroundColor: '#FFF3E0' }]}
          >
            <Text style={styles.sensorCardIcon}>🌡️</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorValue}>
              {(data.temperature ?? 0).toFixed(1)}
            </Text>
            <Text style={styles.sensorUnit}>°C</Text>
          </View>
          <Text style={styles.sensorLabel}>Nhiệt độ</Text>
          <View
            style={[
              styles.sensorBar,
              {
                width: `${Math.min(
                  ((data.temperature ?? 0) / 100) * 100,
                  100
                )}%`,
                backgroundColor: '#FF9800',
              },
            ]}
          />
        </View>

        {/* MQ2 Gas Card */}
        <View style={styles.sensorCard}>
          <View
            style={[styles.sensorIconBg, { backgroundColor: '#E8F5E9' }]}
          >
            <Text style={styles.sensorCardIcon}>💨</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorValue}>{data.mq2Value ?? 0}</Text>
            <Text style={styles.sensorUnit}>ppm</Text>
          </View>
          <Text style={styles.sensorLabel}>Khói/Gas</Text>
          <Text style={styles.sensorThreshold}>Ngưỡng: {thresholds.mq2}</Text>
          <View
            style={[
              styles.sensorBar,
              {
                width: `${Math.min(
                  ((data.mq2Value ?? 0) / thresholds.mq2) * 100,
                  100
                )}%`,
                backgroundColor: '#4CAF50',
              },
            ]}
          />
        </View>

        {/* Flame Card */}
        <View style={styles.sensorCard}>
          <View
            style={[styles.sensorIconBg, { backgroundColor: '#FFEBEE' }]}
          >
            <Text style={styles.sensorCardIcon}>🔥</Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={styles.sensorValue}>{data.flameValue ?? 0}</Text>
            <Text style={styles.sensorUnit}>lux</Text>
          </View>
          <Text style={styles.sensorLabel}>Cảm biến lửa</Text>
          <Text style={styles.sensorThreshold}>Ngưỡng: {thresholds.flame}</Text>
          <View
            style={[
              styles.sensorBar,
              {
                width: `${Math.min(
                  ((data.flameValue ?? 0) / thresholds.flame) * 100,
                  100
                )}%`,
                backgroundColor: '#F44336',
              },
            ]}
          />
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
            onSlidingComplete={(v) => {
              setThresholds((prev) => ({ ...prev, flame: v }));
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
            onSlidingComplete={(v) => {
              setThresholds((prev) => ({ ...prev, mq2: v }));
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
          style={[
            styles.controlButton,
            data.alarmEnabled ? styles.buttonDanger : styles.buttonSuccess,
          ]}
        >
          <View style={styles.controlButtonContent}>
            <View style={styles.controlIconCircle}>
              <Text style={styles.controlIcon}>
                {data.alarmEnabled ? '🔴' : '🟢'}
              </Text>
            </View>
            <View style={styles.controlTextContainer}>
              <Text style={styles.controlButtonText}>
                {data.alarmEnabled ? 'Tắt cảnh báo' : 'Bật cảnh báo'}
              </Text>
              <Text style={styles.controlButtonSubtext}>
                {data.alarmEnabled
                  ? 'Hệ thống đang hoạt động'
                  : 'Hệ thống đang tắt'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📈 Biểu đồ nhiệt độ</Text>
        <LineChart
          data={{
            labels: emptyLabels(safeArray(tempHistory)),
            datasets: [{ data: safeArray(tempHistory) }],
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
            labelColor: () => '#888',
          }}
          bezier
          style={{ borderRadius: 16 }}
        />

        <Text style={styles.chartTitle}>💨 Biểu đồ Gas/Khói</Text>
        <LineChart
          data={{
            labels: emptyLabels(safeArray(gasHistory)),
            datasets: [{ data: safeArray(gasHistory) }],
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: () => '#888',
          }}
          bezier
          style={{ borderRadius: 16 }}
        />

        <Text style={styles.chartTitle}>🔥 Biểu đồ cảm biến lửa</Text>
        <LineChart
          data={{
            labels: emptyLabels(safeArray(flameHistory)),
            datasets: [{ data: safeArray(flameHistory) }],
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
            labelColor: () => '#888',
          }}
          bezier
          style={{ borderRadius: 16 }}
        />
      </View>
    </ScrollView>
  );

  const renderLogoutTab = () => (
    <View style={styles.logoutContainer}>
      <View style={styles.logoutCard}>
        <View style={styles.logoutIconContainer}>
          <Text style={styles.logoutIcon}>👋</Text>
        </View>
        <Text style={styles.logoutTitle}>Đăng xuất</Text>
        <Text style={styles.logoutDescription}>
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống giám sát không?
        </Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutConfirm}
        >
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={alarmStatus.color} />

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
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'logout' && renderLogoutTab()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'system' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('system')}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'system' && styles.navIconActive,
            ]}
          >
            🎛️
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'system' && styles.navLabelActive,
            ]}
          >
            Hệ thống
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'stats' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'stats' && styles.navIconActive,
            ]}
          >
            📊
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'stats' && styles.navLabelActive,
            ]}
          >
            Thống kê
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'logout' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('logout')}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'logout' && styles.navIconActive,
            ]}
          >
            🚪
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'logout' && styles.navLabelActive,
            ]}
          >
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert Modal Pop-up (cháy/khói toàn hệ thống) */}
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
                backgroundColor: alertData.color || '#FF3B30',
                transform: [{ scale: pulseAnim }],
              },
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
                <Text style={styles.alertInfoValue}>
                  {(data.temperature ?? 0).toFixed(1)}°C
                </Text>
              </View>
              <View style={styles.alertInfoRow}>
                <Text style={styles.alertInfoLabel}>💨 Khói/Gas:</Text>
                <Text style={styles.alertInfoValue}>
                  {data.mq2Value ?? 0} ppm
                </Text>
              </View>
              <View style={styles.alertInfoRow}>
                <Text style={styles.alertInfoLabel}>🔥 Lửa:</Text>
                <Text style={styles.alertInfoValue}>
                  {data.flameValue ?? 0} lux
                </Text>
              </View>

              {/* Thông tin vị trí nếu user ở gần <1km */}
              {distanceInfo && distanceInfo.distanceKm < DANGER_RADIUS_KM && (
                <View style={styles.alertInfoRow}>
                  <Text style={styles.alertInfoLabel}>📍 Vị trí của bạn:</Text>
                  <Text style={styles.alertInfoValue}>
                    {distanceInfo.distanceKm < 1
                      ? `${Math.round(distanceInfo.distanceKm * 1000)} m`
                      : `${distanceInfo.distanceKm.toFixed(2)} km`}
                    {distanceInfo.directionText
                      ? ` · ${distanceInfo.directionText}`
                      : ''}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.alertButton} onPress={closeAlert}>
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
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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

  // Status Card
  statusCard: {
    marginHorizontal: 20,
    marginTop: 20,
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

  // Banner khoảng cách
  distanceBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: '#FFD8A8',
  },
  distanceBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D9480F',
    marginBottom: 4,
  },
  distanceBannerText: {
    fontSize: 14,
    color: '#7F4F24',
    marginBottom: 4,
  },
  distanceBannerSub: {
    fontSize: 13,
    color: '#8C6E54',
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
    elevation: 5,
  },
  buttonDanger: {
    backgroundColor: '#FF3B30',
  },
  buttonSuccess: {
    backgroundColor: '#34C759',
  },
  controlButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  controlIcon: {
    fontSize: 24,
  },
  controlTextContainer: {
    flex: 1,
  },
  controlButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  controlButtonSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  // Charts
  chartCard: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    marginTop: 20,
  },

  // Logout Tab
  logoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F5F7FA',
  },
  logoutCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutIcon: {
    fontSize: 48,
  },
  logoutTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  logoutDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  logoutFooter: {
    marginTop: 32,
    alignItems: 'center',
  },
  logoutFooterText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  logoutFooterSubtext: {
    fontSize: 12,
    color: '#AAA',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#F0F2F5',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#1A1A1A',
    fontWeight: '700',
  },

  // Alert Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModal: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  alertIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  alertIcon: {
    fontSize: 56,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  alertDetail: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertInfo: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
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
    fontWeight: '700',
    textAlign: 'right',
  },
  alertButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  alertButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
