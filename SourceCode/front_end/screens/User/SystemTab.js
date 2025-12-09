// SystemTab.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { styles } from './UserScreenStyles';

// phải trùng với UserScreen
const DANGER_RADIUS_KM = 1;

export default function SystemTab({
  data,
  thresholds,
  setThresholds,
  alarmStatus,
  sendControl,
  distanceInfo,
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Card */}
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
          <View style={[styles.sensorIconBg, { backgroundColor: '#FFF3E0' }]}>
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
                  100,
                )}%`,
                backgroundColor: '#FF9800',
              },
            ]}
          />
        </View>

        {/* MQ2 Gas Card */}
        <View style={styles.sensorCard}>
          <View style={[styles.sensorIconBg, { backgroundColor: '#E8F5E9' }]}>
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
                  100,
                )}%`,
                backgroundColor: '#4CAF50',
              },
            ]}
          />
        </View>

        {/* Flame Card */}
        <View style={styles.sensorCard}>
          <View style={[styles.sensorIconBg, { backgroundColor: '#FFEBEE' }]}>
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
                  100,
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
}
