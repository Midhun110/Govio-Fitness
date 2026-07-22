import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'A network error occurred while connecting to the server. Please check your connection and try again.',
  onRetry,
  retryText = 'Try Again',
  compact = false,
}) => {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactIcon}>⚠️</Text>
        <Text style={styles.compactMessage} numberOfLines={2}>{message}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.compactRetryBtn} activeOpacity={0.8} onPress={onRetry}>
            <Text style={styles.compactRetryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} activeOpacity={0.85} onPress={onRetry}>
          <Text style={styles.retryBtnText}>🔄 {retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#151C25',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 11,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#0D141D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  compactMessage: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  compactRetryBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  compactRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
