import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'none';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
}

const { width, height } = Dimensions.get('window');

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'slide',
  presentationStyle = 'overFullScreen',
}) => {
  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          <BlurView intensity={25} tint="dark" style={styles.modalContent}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.15)',
                'rgba(255, 255, 255, 0.05)',
              ]}
              style={styles.gradient}
            />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
              style={styles.highlight}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.3 }}
            />
            <View style={styles.border} />
            <View style={styles.contentWrapper}>
              {children}
            </View>
          </BlurView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  modalContent: {
    flex: 1,
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderRadius: 24,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
  },
  contentWrapper: {
    flex: 1,
    padding: 24,
  },
});