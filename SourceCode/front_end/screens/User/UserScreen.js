import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StatusBar,
    SafeAreaView,
    Alert,
    Animated,
    Vibration,
    TouchableOpacity, // ← thêm dòng này
  } from 'react-native';
  ;
import axios from 'axios';
import io from 'socket.io-client';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';

import SystemTab from './SystemTab';
import StatsTab from './StatsTab';
import LogoutTab from './LogoutTab';
import AlertModal from './AlertModal';
import { styles } from './UserScreenStyles';

const ENDPOINT = 'http://172.20.10.2:5000';
const MAX_HISTORY = 20;

// Điểm mốc (tòa nhà / vị trí cháy mặc định)
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

  // ====== Socket nhận dữ liệu cảm biến (giữ nguyên logic cũ) ======
  useEffect(() => {
    const socket = io(ENDPOINT, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {});

    socket.on('sensorUpdate', (newData) => {
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
              type: 'GAS',
              message: 'Phát hiện khí gas vượt ngưỡng!',
              icon: '⚠️',
            });

            // nếu bạn có playGasSound thì vẫn dùng
            if (typeof playGasSound === 'function') {
              playGasSound();
            }

            Speech.speak(
              'Cảnh báo! Nồng độ khí gas vượt ngưỡng an toàn. Vui lòng mở cửa thoáng khí và rời khỏi khu vực nguy hiểm.',
            );

            setShowAlert(true);
          }

          if (alarmType === 2) {
            // LỬA
            setAlertData({
              type: 'LỬA',
              message: 'Phát hiện lửa! Nguy hiểm!',
              icon: '🔥',
            });

            if (typeof playFireSound === 'function') {
              playFireSound();
            }

            Speech.speak(
              'Nguy hiểm! Phát hiện đám cháy! Vui lòng sơ tán ngay lập tức khỏi khu vực. Giữ bình tĩnh và tránh hít phải khói.',
            );

            setShowAlert(true);
          }

          // =============================
          // 📍 CẢNH BÁO KHOẢNG CÁCH & HƯỚNG
          // (Dùng GPS người dùng)
          // =============================
          if (location) {
            const userLat = location.latitude ?? location.coords?.latitude;
            const userLon = location.longitude ?? location.coords?.longitude;

            if (userLat != null && userLon != null) {
              const distanceKm = getDistanceKm(userLat, userLon, REF_LAT, REF_LON);
              const bearing = calculateBearing(userLat, userLon, REF_LAT, REF_LON);
              const directionText = bearingToDirection(bearing);

              const now = Date.now();

              if (distanceKm <= DANGER_RADIUS_KM) {
                if (now - lastDistanceAlertTime > DISTANCE_ALERT_INTERVAL_MS) {
                  Speech.speak(
                    `Chú ý! Bạn đang ở trong vùng nguy hiểm cách điểm cháy khoảng ${distanceKm.toFixed(
                      2,
                    )} kilomet khoảng cách tương đối. Hướng thoát an toàn theo hướng ${directionText}.`,
                  );

                  setLastDistanceAlertTime(now);
                }
              }

              setDistanceInfo({
                distanceKm,
                directionText,
                messageText:
                  distanceKm <= DANGER_RADIUS_KM
                    ? 'Bạn đang trong vùng nguy hiểm!'
                    : 'An toàn',
                updatedAt: new Date(),
                latitude: userLat,
                longitude: userLon,
              });
            }
          }
        } catch (e) {}

        // cập nhật dữ liệu mới sau xử lý
        return {
          temperature: sanitize(newData.temperature),
          mq2Value: sanitize(newData.mq2Value),
          flameValue: sanitize(newData.flameValue),
          alarm: Number.isFinite(Number(newData.alarm)) ? Number(newData.alarm) : 0,
          alarmEnabled:
            typeof newData.alarmEnabled === 'boolean'
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
  }, [lastDistanceAlertTime, location]);

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

        const directionText = info.directionText || 'không xác định';

        // ================================
        // 🔥 Nếu là CHÁY (alarm = 2)
        // ================================
        let messageText = '';
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
          language: 'vi-VN',
          rate: 1.0,
          pitch: 1.0,
        });
      }
    } catch (e) {
      console.warn('Lỗi khi cảnh báo khoảng cách:', e);
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
    } else if (alarmLevel === 1) {
      setAlertData({
        type: 'GAS',
        message: 'Phát hiện khí gas vượt ngưỡng!',
        detail:
          'Cảnh báo nguy hiểm! Có rò rỉ khí gas. Vui lòng mở cửa thông gió và rời khỏi khu vực ngay lập tức.',
        icon: '⚠️',
        color: '#FF9500',
      });

      if (typeof playGasSound === 'function') {
        playGasSound();
      }

      Speech.stop();
      setTimeout(() => {
        Speech.speak(
          'Cảnh báo nguy hiểm! Có rò rỉ khí gas. Vui lòng mở cửa thông gió và rời khỏi khu vực ngay lập tức.',
          { language: 'vi-VN', rate: 1.0, pitch: 1.0 },
        );
      }, 300);
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
      ]),
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
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?', [
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
    ]);
  };

  const getAlarmStatus = () => {
    if (data.alarm === 2)
      return { text: 'PHÁT HIỆN LỬA', color: '#FF3B30', icon: '🔥' };
    if (data.alarm === 1)
      return { text: 'CẢNH BÁO KHÓI/GAS', color: '#FF9500', icon: '💨' };
    return { text: 'Hệ thống An toàn', color: '#34C759', icon: '✅' };
  };

  const alarmStatus = getAlarmStatus();

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
        {activeTab === 'system' && (
          <SystemTab
            data={data}
            thresholds={thresholds}
            setThresholds={setThresholds}
            alarmStatus={alarmStatus}
            sendControl={sendControl}
            distanceInfo={distanceInfo}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            tempHistory={tempHistory}
            gasHistory={gasHistory}
            flameHistory={flameHistory}
          />
        )}

        {activeTab === 'logout' && (
          <LogoutTab
            handleLogoutConfirm={handleLogoutConfirm}
            setActiveTab={setActiveTab}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'system' && styles.navItemActive]}
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
          style={[styles.navItem, activeTab === 'stats' && styles.navItemActive]}
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
          style={[styles.navItem, activeTab === 'logout' && styles.navItemActive]}
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
      <AlertModal
        visible={showAlert}
        onClose={closeAlert}
        alertData={alertData}
        pulseAnim={pulseAnim}
        data={data}
        distanceInfo={distanceInfo}
      />
    </SafeAreaView>
  );
}
