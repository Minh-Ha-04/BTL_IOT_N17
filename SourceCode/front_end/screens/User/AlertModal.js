// AlertModal.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { styles } from './UserScreenStyles';

// trùng với UserScreen
const DANGER_RADIUS_KM = 1;

export default function AlertModal({
  visible,
  onClose,
  alertData,
  pulseAnim,
  data,
  distanceInfo,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
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
              <Text style={styles.alertInfoValue}>{data.mq2Value ?? 0} ppm</Text>
            </View>
            <View style={styles.alertInfoRow}>
              <Text style={styles.alertInfoLabel}>🔥 Lửa:</Text>
              <Text style={styles.alertInfoValue}>{data.flameValue ?? 0} lux</Text>
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

          <TouchableOpacity style={styles.alertButton} onPress={onClose}>
            <Text style={styles.alertButtonText}>✓ ĐÃ HIỂU</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
