// StatsTab.js
import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { styles } from './UserScreenStyles';

const { width } = Dimensions.get('window');

const safeArray = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return [0];
  return arr.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));
};

const emptyLabels = (arr) => Array(arr.length).fill('');

export default function StatsTab({ tempHistory, gasHistory, flameHistory }) {
  return (
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
}
